"""
OSINT Sanctions Intelligence Tool — Document Analysis Edition
--------------------------------------------------------------
Two modes:
  1. Manual Search — type a name, get a full OSINT report.
  2. Document Analysis — upload a document (PDF, image, text, docx),
     extract every individual mentioned, run OSINT on selected subjects,
     and download a combined compliance report.

Powered by Claude with native PDF/image understanding + web search.

Run locally:
    streamlit run osint_tool.py

Deploy to Streamlit Cloud:
    Add ANTHROPIC_API_KEY to app Secrets.

Dependencies:
    pip install streamlit anthropic reportlab python-docx
"""

import base64
import datetime
import io
import json
import re

import anthropic
import streamlit as st
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="OSINT Sanctions Intelligence",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ---------------------------------------------------------------------------
# Cyrillic → Latin transliteration
# ---------------------------------------------------------------------------
CYRILLIC_MAP = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}

def transliterate(text: str) -> str:
    """Convert Cyrillic characters to Latin equivalents."""
    out = []
    for char in text:
        lower = char.lower()
        if lower in CYRILLIC_MAP:
            trans = CYRILLIC_MAP[lower]
            out.append(trans.capitalize() if char.isupper() else trans)
        else:
            out.append(char)
    return "".join(out)

def has_cyrillic(text: str) -> bool:
    return bool(re.search("[\u0400-\u04FF]", text))


# ---------------------------------------------------------------------------
# Document handling — convert any supported file into Anthropic content blocks
# ---------------------------------------------------------------------------
SUPPORTED_TYPES = {
    "application/pdf": "pdf",
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "image/gif": "image",
    "text/plain": "text",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def file_to_content_block(uploaded_file):
    """
    Convert an uploaded Streamlit file into an Anthropic API content block.
    Returns (content_block, file_label).
    """
    mime = uploaded_file.type
    file_kind = SUPPORTED_TYPES.get(mime, "unknown")
    file_bytes = uploaded_file.getvalue()

    if file_kind == "pdf":
        return (
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": base64.standard_b64encode(file_bytes).decode("utf-8"),
                },
            },
            f"PDF: {uploaded_file.name}",
        )

    if file_kind == "image":
        return (
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": mime,
                    "data": base64.standard_b64encode(file_bytes).decode("utf-8"),
                },
            },
            f"Image: {uploaded_file.name}",
        )

    if file_kind == "text":
        text = file_bytes.decode("utf-8", errors="replace")
        return (
            {"type": "text", "text": f"--- BEGIN DOCUMENT: {uploaded_file.name} ---\n{text}\n--- END DOCUMENT ---"},
            f"Text: {uploaded_file.name}",
        )

    if file_kind == "docx":
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return (
            {"type": "text", "text": f"--- BEGIN DOCUMENT: {uploaded_file.name} ---\n{text}\n--- END DOCUMENT ---"},
            f"DOCX: {uploaded_file.name}",
        )

    raise ValueError(f"Unsupported file type: {mime}")


# ---------------------------------------------------------------------------
# Entity extraction — pull people out of a document with Claude
# ---------------------------------------------------------------------------
ENTITY_EXTRACTION_PROMPT = """You are a senior compliance analyst extracting personal information from documents for sanctions screening and KYC purposes.

Examine the attached document(s) carefully and extract EVERY individual person mentioned. This includes:
- Named individuals (full or partial names)
- Signatories, directors, beneficial owners
- Witnesses, agents, representatives
- Anyone mentioned with identifying details

For each person, extract the following fields. Use null if a field is not available:

- full_name: Full name in Latin script (transliterate from Cyrillic if needed)
- name_native: Original name in source language (e.g. Cyrillic) if applicable
- date_of_birth: Format YYYY-MM-DD if available
- nationality: Country or nationality
- addresses: List of addresses associated with the person
- occupation: Job title, role, or position
- identifiers: Object with passport_number, tax_id, or other ID numbers if visible
- context: One sentence describing how this person appears in the document
- confidence: "high" / "medium" / "low" — your confidence this is a real, fully-identified person

Return your findings as VALID JSON ONLY, with this exact structure:

{
  "document_type": "Brief description of what this document is",
  "document_summary": "2-3 sentence summary of the document's purpose and key points",
  "entities": [
    {
      "full_name": "...",
      "name_native": "...",
      "date_of_birth": "...",
      "nationality": "...",
      "addresses": ["..."],
      "occupation": "...",
      "identifiers": {"passport_number": "...", "tax_id": "..."},
      "context": "...",
      "confidence": "high"
    }
  ]
}

Return ONLY the JSON object. No markdown code fences. No commentary before or after."""


def extract_entities_from_document(content_blocks, api_key):
    """Send document(s) to Claude for entity extraction. Returns parsed JSON dict."""
    client = anthropic.Anthropic(api_key=api_key)

    user_content = list(content_blocks) + [
        {"type": "text", "text": ENTITY_EXTRACTION_PROMPT}
    ]

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{"role": "user", "content": user_content}],
    )

    raw_text = ""
    for block in response.content:
        if hasattr(block, "type") and block.type == "text":
            raw_text += block.text

    # Strip code fences if Claude added them
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Could not parse entity extraction response as JSON: {e}")


# ---------------------------------------------------------------------------
# OSINT search via Claude + web search
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a senior financial crime analyst specialising in 
Russian/CIS sanctions screening and open-source intelligence (OSINT) for 
crypto exchanges and Virtual Asset Service Providers (VASPs).

Your role is to produce structured, professional compliance intelligence 
reports. Write exclusively in clear, plain English. Be specific and cite 
sources where possible. Never fabricate information — if nothing is found 
for a section, state "No adverse findings at this time."

Follow the exact output structure requested by the user."""


def build_osint_prompt(name, dob="", nationality="", companies="", addresses=""):
    """Compose the OSINT user prompt with optional context fields."""
    context_lines = []
    if dob:
        context_lines.append(f"- Date of Birth: {dob}")
    if nationality:
        context_lines.append(f"- Nationality / Region: {nationality}")
    if companies:
        context_lines.append(f"- Associated Entities: {companies}")
    if addresses:
        context_lines.append(f"- Known Addresses: {addresses}")
    context_block = "\n".join(context_lines) if context_lines else "- No additional context provided."

    return f"""Conduct a full OSINT and sanctions screening investigation on the following subject.

SUBJECT: {name}
ADDITIONAL CONTEXT:
{context_block}

Return your findings using EXACTLY this structure, with each section header on its own line:

## 1. IDENTITY SUMMARY
Full name, known aliases, name variations, Cyrillic spelling if applicable, 
date of birth if confirmed, nationalities, and passport/ID details if publicly known.

## 2. SANCTIONS & WATCHLIST HITS
Check ALL of the following and report hits or "No adverse findings":
- OFAC SDN List (US Treasury)
- EU Consolidated Sanctions List
- UK Office of Financial Sanctions Implementation (OFSI)
- UN Security Council Consolidated List
- Swiss SECO Sanctions
- Any Russian-specific sanctions programmes (CAATSA, EO 13662, etc.)

For each confirmed hit, state: List name | Programme | Designation date | Reason listed.

## 3. POLITICALLY EXPOSED PERSON (PEP) STATUS
Current or former government roles, political party affiliations, 
state-owned enterprise positions, military or intelligence connections.

## 4. ADVERSE MEDIA
Findings from credible news sources. Focus on: financial crime, fraud, 
money laundering, corruption, bribery, criminal proceedings, regulatory 
sanctions, or reputational risk events. Cite sources by name.

## 5. CORPORATE & OWNERSHIP CONNECTIONS
Known companies, directorships, UBO structures, shell company links, 
offshore holdings, trust arrangements.

## 6. CRYPTO & BLOCKCHAIN EXPOSURE
Known wallet addresses, exchange accounts, involvement in crypto-related 
enforcement actions, blockchain analytics flags, or links to sanctioned 
crypto entities (e.g. Garantex, Hydra).

## 7. OVERALL RISK RATING
Risk Level: [CLEAR / LOW / MEDIUM / HIGH / CRITICAL]

Provide a 4–6 sentence plain-English summary of the overall risk picture, 
written for a compliance officer making a customer due diligence decision.

## 8. RECOMMENDED ACTIONS
Bullet list of specific next steps the compliance team should take.

Search thoroughly before responding. Be precise and professional."""


def run_osint(name, dob="", nationality="", companies="", addresses="", api_key=""):
    """Run an OSINT search via Claude + web search."""
    client = anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{
            "role": "user",
            "content": build_osint_prompt(name, dob, nationality, companies, addresses),
        }],
    )

    report_text = ""
    for block in response.content:
        if hasattr(block, "type") and block.type == "text":
            report_text += block.text

    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return report_text, timestamp


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------
RISK_COLORS = {
    "CLEAR":    colors.HexColor("#2ecc71"),
    "LOW":      colors.HexColor("#27ae60"),
    "MEDIUM":   colors.HexColor("#f39c12"),
    "HIGH":     colors.HexColor("#e67e22"),
    "CRITICAL": colors.HexColor("#e74c3c"),
}


def detect_risk_level(report_text):
    match = re.search(
        r"Risk Level[:\s]+\[?(CLEAR|LOW|MEDIUM|HIGH|CRITICAL)\]?",
        report_text,
        re.IGNORECASE,
    )
    return match.group(1).upper() if match else "UNKNOWN"


def _build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("ReportTitle", parent=base["Title"], fontSize=18,
            textColor=colors.HexColor("#1a1a2e"), spaceAfter=4),
        "subtitle": ParagraphStyle("Subtitle", parent=base["Normal"], fontSize=10,
            textColor=colors.HexColor("#555555"), spaceAfter=2),
        "section": ParagraphStyle("SectionHeader", parent=base["Heading2"], fontSize=11,
            textColor=colors.HexColor("#1a1a2e"), spaceBefore=12, spaceAfter=4),
        "subject_header": ParagraphStyle("SubjectHeader", parent=base["Heading1"], fontSize=14,
            textColor=colors.white, backColor=colors.HexColor("#1a1a2e"),
            borderPadding=8, spaceBefore=10, spaceAfter=6),
        "body": ParagraphStyle("Body", parent=base["Normal"], fontSize=9, leading=14,
            textColor=colors.HexColor("#333333"), spaceAfter=4),
        "bullet": ParagraphStyle("Bullet", parent=base["Normal"], fontSize=9, leading=14,
            textColor=colors.HexColor("#333333"), leftIndent=12, spaceAfter=2),
        "disclaimer": ParagraphStyle("Disclaimer", parent=base["Normal"], fontSize=7,
            textColor=colors.HexColor("#888888"), leading=10),
    }


def _render_report_text(story, report_text, styles):
    """Append a single OSINT report's body to the PDF story."""
    for line in report_text.split("\n"):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 2 * mm))
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(stripped[3:].strip(), styles["section"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
        elif stripped.startswith(("- ", "* ")):
            clean = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", stripped[2:])
            story.append(Paragraph(f"• {clean}", styles["bullet"]))
        elif stripped.startswith("**") and stripped.endswith("**"):
            story.append(Paragraph(f"<b>{stripped.strip('*')}</b>", styles["body"]))
        else:
            clean = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", stripped)
            story.append(Paragraph(clean, styles["body"]))


def _add_disclaimer(story, styles):
    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "DISCLAIMER: This report is generated using open-source intelligence and AI-assisted "
        "analysis. It must not be used as the sole basis for regulatory compliance decisions. "
        "Always verify sanctions hits against official government lists and consult qualified "
        "legal counsel before taking action.",
        styles["disclaimer"],
    ))


def generate_single_pdf(subject, report_text, timestamp, dob="", nationality="", companies=""):
    """Generate a PDF for a single subject."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=20 * mm, leftMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )
    styles = _build_styles()
    story = []
    risk_level = detect_risk_level(report_text)
    risk_color = RISK_COLORS.get(risk_level, colors.grey)

    story.append(Paragraph("OSINT Sanctions Intelligence Report", styles["title"]))
    story.append(Paragraph("Confidential — For Compliance Use Only", styles["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a1a2e")))
    story.append(Spacer(1, 4 * mm))

    meta_rows = [["Subject", subject], ["Generated", timestamp]]
    if dob: meta_rows.append(["Date of Birth", dob])
    if nationality: meta_rows.append(["Nationality / Region", nationality])
    if companies: meta_rows.append(["Associated Entities", companies])
    meta_rows.append(["Risk Rating", risk_level])

    meta_table = Table(meta_rows, colWidths=[45 * mm, 120 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f0f0")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (1, len(meta_rows) - 1), (1, len(meta_rows) - 1), risk_color),
        ("TEXTCOLOR", (1, len(meta_rows) - 1), (1, len(meta_rows) - 1), colors.white),
        ("FONTNAME", (1, len(meta_rows) - 1), (1, len(meta_rows) - 1), "Helvetica-Bold"),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))

    _render_report_text(story, report_text, styles)
    _add_disclaimer(story, styles)

    doc.build(story)
    return buffer.getvalue()


def generate_combined_pdf(document_summary, osint_reports, timestamp):
    """Generate a multi-subject PDF with cover, risk overview, and per-subject reports."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=20 * mm, leftMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )
    styles = _build_styles()
    story = []

    # Cover
    story.append(Paragraph("Document OSINT Investigation Report", styles["title"]))
    story.append(Paragraph("Confidential — For Compliance Use Only", styles["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a1a2e")))
    story.append(Spacer(1, 4 * mm))

    summary_rows = [
        ["Generated", timestamp],
        ["Document Type", document_summary.get("document_type", "Unknown")],
        ["Subjects Investigated", str(len(osint_reports))],
    ]
    summary_table = Table(summary_rows, colWidths=[45 * mm, 120 * mm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f0f0")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 4 * mm))

    if document_summary.get("document_summary"):
        story.append(Paragraph("<b>Document Summary:</b>", styles["body"]))
        story.append(Paragraph(document_summary["document_summary"], styles["body"]))
        story.append(Spacer(1, 4 * mm))

    # Risk overview table
    if osint_reports:
        story.append(Paragraph("<b>Subjects Risk Overview:</b>", styles["body"]))
        risk_rows = [["#", "Subject", "Role / Context", "Risk Rating"]]
        for i, r in enumerate(osint_reports, 1):
            risk = detect_risk_level(r["report_text"])
            risk_rows.append([str(i), r["subject"], (r.get("context", "") or "")[:60], risk])

        risk_table = Table(risk_rows, colWidths=[10 * mm, 50 * mm, 75 * mm, 30 * mm])
        risk_style = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        for row_idx, r in enumerate(osint_reports, 1):
            risk = detect_risk_level(r["report_text"])
            color = RISK_COLORS.get(risk, colors.grey)
            risk_style.append(("BACKGROUND", (3, row_idx), (3, row_idx), color))
            risk_style.append(("TEXTCOLOR", (3, row_idx), (3, row_idx), colors.white))
            risk_style.append(("FONTNAME", (3, row_idx), (3, row_idx), "Helvetica-Bold"))
        risk_table.setStyle(TableStyle(risk_style))
        story.append(risk_table)

    # Per-subject sections
    for i, r in enumerate(osint_reports, 1):
        story.append(PageBreak())
        story.append(Paragraph(f"{i}. {r['subject']}", styles["subject_header"]))
        if r.get("context"):
            story.append(Paragraph(f"<i>Context in document: {r['context']}</i>", styles["body"]))
            story.append(Spacer(1, 3 * mm))
        _render_report_text(story, r["report_text"], styles)

    _add_disclaimer(story, styles)

    doc.build(story)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------
def get_api_key():
    try:
        key = st.secrets["ANTHROPIC_API_KEY"]
        st.sidebar.success("✅ API key loaded from Secrets")
        return key
    except Exception:
        return st.sidebar.text_input(
            "Anthropic API Key", type="password",
            help="Get one at console.anthropic.com",
        )


def render_sidebar():
    st.sidebar.title("⚙️ Configuration")
    api_key = get_api_key()
    st.sidebar.markdown("---")
    st.sidebar.markdown(
        "**Capabilities**\n"
        "- Manual name search\n"
        "- Document entity extraction\n"
        "- Multi-subject OSINT batch\n"
        "- Combined PDF reports"
    )
    st.sidebar.markdown("---")
    st.sidebar.markdown(
        "**Sources searched**\n"
        "- OFAC SDN, EU, UK, UN sanctions\n"
        "- News & adverse media\n"
        "- Corporate registries\n"
        "- Crypto enforcement databases"
    )
    st.sidebar.markdown("---")
    st.sidebar.caption(
        "⚠️ AI-assisted OSINT. Always verify hits against official "
        "sanctions lists before customer decisions."
    )
    return api_key


def safe_filename(name):
    return re.sub(r"[^\w\s-]", "", name).strip().replace(" ", "_")


# ---------------------------------------------------------------------------
# Tab 1 — Manual Search
# ---------------------------------------------------------------------------
def render_manual_search(api_key):
    st.markdown(
        "Enter a single subject name to generate a full OSINT compliance report. "
        "Cyrillic input is automatically transliterated."
    )

    col1, col2 = st.columns(2)
    with col1:
        name_input = st.text_input("Full Name *(required)*", placeholder="e.g. Ivan Petrov or Иван Петров", key="m_name")
        dob_input = st.text_input("Date of Birth *(optional)*", placeholder="e.g. 1974-08-15", key="m_dob")
    with col2:
        nationality_input = st.text_input("Nationality / Region *(optional)*", placeholder="e.g. Russian, Moscow", key="m_nat")
        companies_input = st.text_input("Associated Entities *(optional)*", placeholder="e.g. Gazprom, Alfa Capital", key="m_co")

    if st.button("🔎 Run OSINT Search", type="primary", key="m_run"):
        if not name_input.strip():
            st.error("Please enter a subject name.")
            return
        if not api_key:
            st.error("API key required. Add it in the sidebar.")
            return

        display_name = name_input.strip()
        if has_cyrillic(display_name):
            latin_name = transliterate(display_name)
            st.info(f"Cyrillic detected — transliterated to: **{latin_name}**")
            search_name = f"{latin_name} ({display_name})"
        else:
            search_name = display_name

        try:
            with st.spinner(f"Searching open sources for **{display_name}**..."):
                report_text, timestamp = run_osint(
                    name=search_name, dob=dob_input,
                    nationality=nationality_input, companies=companies_input,
                    api_key=api_key,
                )

            risk = detect_risk_level(report_text)
            color = {"CLEAR": "green", "LOW": "green", "MEDIUM": "orange",
                     "HIGH": "red", "CRITICAL": "red"}.get(risk, "grey")
            st.success("Report generated.")
            st.markdown(f"**Overall Risk Rating:** :{color}[**{risk}**]")

            st.markdown("---")
            st.markdown(f"## Report: {display_name}")
            st.caption(f"Generated: {timestamp}")
            st.markdown(report_text)

            st.markdown("---")
            with st.spinner("Building PDF..."):
                pdf_bytes = generate_single_pdf(
                    subject=display_name, report_text=report_text, timestamp=timestamp,
                    dob=dob_input, nationality=nationality_input, companies=companies_input,
                )

            date_str = datetime.datetime.utcnow().strftime("%Y%m%d")
            st.download_button(
                "⬇️ Download PDF Report",
                data=pdf_bytes,
                file_name=f"OSINT_{safe_filename(display_name)}_{date_str}.pdf",
                mime="application/pdf",
            )
        except anthropic.AuthenticationError:
            st.error("Invalid API key. Check it at console.anthropic.com.")
        except Exception as e:
            st.error(f"{type(e).__name__}: {e}")


# ---------------------------------------------------------------------------
# Tab 2 — Document Analysis
# ---------------------------------------------------------------------------
def render_document_analysis(api_key):
    st.markdown(
        "Upload a document and the tool will extract every individual mentioned, "
        "then run OSINT on the people you select."
    )
    st.markdown(
        "**Supported formats:** PDF, JPG, PNG, WEBP, TXT, DOCX. "
        "Best results with corporate filings, KYC packs, news articles, court documents."
    )

    uploaded_files = st.file_uploader(
        "Upload document(s)",
        type=["pdf", "jpg", "jpeg", "png", "webp", "txt", "docx"],
        accept_multiple_files=True,
        key="doc_upload",
    )

    # ── Stage 1: Extract entities ─────────────────────────────────────────
    if uploaded_files and st.button("🔬 Extract People from Document", type="primary", key="extract_btn"):
        if not api_key:
            st.error("API key required. Add it in the sidebar.")
            return
        try:
            with st.spinner("Reading document(s) and extracting entities..."):
                content_blocks = []
                labels = []
                for f in uploaded_files:
                    block, label = file_to_content_block(f)
                    content_blocks.append(block)
                    labels.append(label)

                extraction = extract_entities_from_document(content_blocks, api_key)
                st.session_state["extraction"] = extraction
                st.session_state["uploaded_labels"] = labels
                # Clear any prior OSINT results from a previous run
                st.session_state.pop("osint_reports", None)
        except Exception as e:
            st.error(f"Extraction failed — {type(e).__name__}: {e}")
            return

    # ── Stage 2: Display extracted entities + selection ───────────────────
    if "extraction" in st.session_state:
        extraction = st.session_state["extraction"]
        entities = extraction.get("entities", [])

        st.markdown("---")
        st.markdown("### 📄 Document Analysis Results")
        st.markdown(f"**Document type:** {extraction.get('document_type', 'Unknown')}")
        if extraction.get("document_summary"):
            st.markdown(f"**Summary:** {extraction['document_summary']}")

        if not entities:
            st.warning("No individuals were identified in this document.")
            return

        st.markdown(f"### 👥 {len(entities)} Individual(s) Identified")
        st.caption("🟢 high confidence · 🟡 medium · 🔴 low — high-confidence subjects pre-selected")

        selected_indices = []
        for i, entity in enumerate(entities):
            name_display = entity.get("full_name") or "Unknown"
            confidence = entity.get("confidence", "medium")
            confidence_emoji = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(confidence, "⚪")

            col_check, col_expand = st.columns([1, 20])
            with col_check:
                is_selected = st.checkbox(
                    "Select", key=f"sel_{i}",
                    value=(confidence == "high"),
                    label_visibility="collapsed",
                )
                if is_selected:
                    selected_indices.append(i)
            with col_expand:
                with st.expander(f"{confidence_emoji} **{name_display}** — {entity.get('occupation') or 'Role unknown'}"):
                    rows = []
                    if entity.get("name_native"): rows.append(("Native script", entity["name_native"]))
                    if entity.get("date_of_birth"): rows.append(("Date of Birth", entity["date_of_birth"]))
                    if entity.get("nationality"): rows.append(("Nationality", entity["nationality"]))
                    if entity.get("addresses"): rows.append(("Addresses", "; ".join(entity["addresses"])))
                    if entity.get("occupation"): rows.append(("Occupation", entity["occupation"]))
                    ids = entity.get("identifiers") or {}
                    id_parts = [f"{k}: {v}" for k, v in ids.items() if v]
                    if id_parts: rows.append(("Identifiers", "; ".join(id_parts)))
                    if entity.get("context"): rows.append(("Context in document", entity["context"]))
                    rows.append(("Extraction confidence", confidence.upper()))

                    for label, value in rows:
                        st.markdown(f"- **{label}:** {value}")

        st.markdown("---")
        st.markdown(f"**{len(selected_indices)} subject(s) selected for OSINT.**")
        st.caption("Each subject takes 30–60 seconds.")

        if st.button("🚀 Run OSINT on Selected Subjects", type="primary", key="osint_run"):
            if not selected_indices:
                st.warning("Select at least one subject to investigate.")
                return

            progress = st.progress(0)
            status = st.empty()
            osint_reports = []

            try:
                for n, idx in enumerate(selected_indices, 1):
                    entity = entities[idx]
                    name = entity.get("full_name") or "Unknown"
                    if has_cyrillic(name):
                        name = transliterate(name)

                    status.markdown(f"🔍 Investigating **{name}** ({n} of {len(selected_indices)})...")

                    addresses = "; ".join(entity.get("addresses") or [])
                    report_text, ts = run_osint(
                        name=name,
                        dob=entity.get("date_of_birth") or "",
                        nationality=entity.get("nationality") or "",
                        companies="",
                        addresses=addresses,
                        api_key=api_key,
                    )
                    osint_reports.append({
                        "subject": name,
                        "report_text": report_text,
                        "timestamp": ts,
                        "context": entity.get("context", ""),
                        "entity": entity,
                    })
                    progress.progress(n / len(selected_indices))

                status.markdown(f"✅ All {len(osint_reports)} investigations complete.")
                st.session_state["osint_reports"] = osint_reports
                st.session_state["doc_summary"] = extraction
            except Exception as e:
                st.error(f"OSINT run failed — {type(e).__name__}: {e}")
                return

    # ── Stage 3: Display OSINT results ─────────────────────────────────────
    if "osint_reports" in st.session_state:
        osint_reports = st.session_state["osint_reports"]
        doc_summary = st.session_state.get("doc_summary", {})
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        st.markdown("---")
        st.markdown("## 📊 OSINT Investigation Results")

        # Risk overview table
        st.markdown("### Risk Overview")
        overview_data = []
        for r in osint_reports:
            risk = detect_risk_level(r["report_text"])
            overview_data.append({
                "Subject": r["subject"],
                "Context": (r.get("context", "") or "")[:80],
                "Risk": risk,
            })
        st.dataframe(overview_data, use_container_width=True, hide_index=True)

        # Per-subject expanders
        st.markdown("### Detailed Reports")
        for i, r in enumerate(osint_reports, 1):
            risk = detect_risk_level(r["report_text"])
            color = {"CLEAR": "green", "LOW": "green", "MEDIUM": "orange",
                     "HIGH": "red", "CRITICAL": "red"}.get(risk, "grey")
            with st.expander(f"{i}. {r['subject']} — Risk: {risk}"):
                st.markdown(f"**Risk Rating:** :{color}[**{risk}**]")
                if r.get("context"):
                    st.caption(f"Context in document: {r['context']}")
                st.markdown(r["report_text"])

        # Combined PDF
        st.markdown("---")
        with st.spinner("Building combined PDF..."):
            combined_pdf = generate_combined_pdf(doc_summary, osint_reports, timestamp)

        date_str = datetime.datetime.utcnow().strftime("%Y%m%d")
        st.download_button(
            "⬇️ Download Combined PDF Report",
            data=combined_pdf,
            file_name=f"OSINT_Document_Investigation_{date_str}.pdf",
            mime="application/pdf",
        )

        if st.button("🔄 Start New Investigation", key="reset"):
            for key in ["extraction", "uploaded_labels", "osint_reports", "doc_summary"]:
                st.session_state.pop(key, None)
            st.rerun()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    api_key = render_sidebar()

    st.title("🔍 OSINT Sanctions Intelligence")
    st.markdown(
        "Russian national screening for **crypto exchanges and VASPs**. "
        "Search by name or upload a document to investigate everyone mentioned."
    )

    tab1, tab2 = st.tabs(["🔎 Manual Search", "📄 Document Analysis"])
    with tab1:
        render_manual_search(api_key)
    with tab2:
        render_document_analysis(api_key)


if __name__ == "__main__":
    main()
