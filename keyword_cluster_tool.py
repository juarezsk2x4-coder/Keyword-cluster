"""
Keyword Intent & Clustering Tool
--------------------------------
A Streamlit app that ingests a raw keyword list, classifies each keyword by
search intent using a fast regex-based rule engine, then groups keywords into
intent-pure semantic clusters using Sentence-BERT embeddings.

Run with:
    streamlit run keyword_cluster_tool.py

Dependencies:
    pip install streamlit pandas numpy scikit-learn sentence-transformers
"""

import re
from typing import List, Tuple

import numpy as np
import pandas as pd
import streamlit as st
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------------------------------
# Page Configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Keyword Intent & Clustering Tool",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ---------------------------------------------------------------------------
# Intent Classification Rules
# ---------------------------------------------------------------------------
# Order matters: Transactional and Commercial are checked before Informational
# because phrases like "best free trial" should resolve to Transactional intent.

INTENT_RULES = {
    "Transactional": {
        "patterns": [
            r"\bbuy\b", r"\bprice(s|ing)?\b", r"\bcost\b", r"\bdiscount\b",
            r"\bcoupon\b", r"\bdeal(s)?\b", r"\bdemo\b", r"\bfree trial\b",
            r"\btrial\b", r"\bsign\s?up\b", r"\bsubscribe\b", r"\bpurchase\b",
            r"\border\b", r"\bcheckout\b", r"\bplan(s)?\b", r"\bquote\b",
        ],
        "angle": "Product page, Pricing page, or Signup/Demo landing page",
    },
    "Commercial": {
        "patterns": [
            r"\bbest\b", r"\btop\b", r"\bvs\.?\b", r"\bversus\b",
            r"\breview(s)?\b", r"\balternative(s)?\b", r"\bcompare\b",
            r"\bcomparison\b", r"\b(\d+)\s+(best|top)\b", r"\bcheapest\b",
            r"\bpopular\b", r"\bleading\b", r"\brecommend(ed|ation)?\b",
        ],
        "angle": "Comparison Listicle, Review, or Buyer's Guide",
    },
    "Informational": {
        "patterns": [
            r"\bhow\s+to\b", r"\bhow\s+do(es)?\b", r"\bwhat\s+(is|are|does)\b",
            r"\bwhy\b", r"\bwhen\b", r"\bwhere\b", r"\bwho\b",
            r"\bguide\b", r"\btutorial\b", r"\bexample(s)?\b",
            r"\bdefinition\b", r"\bmeaning\b", r"\bexplain(ed|ation)?\b",
            r"\btips\b", r"\blearn\b", r"\bideas\b", r"\bbasics\b",
            r"\bintroduction\b", r"\b101\b",
        ],
        "angle": "Blog Post, Tutorial, or Glossary entry",
    },
}

# Common AI-automation brand terms used to detect Navigational intent.
# Extend this list to fit your specific niche.
BRAND_TERMS = {
    "zapier", "make", "n8n", "ifttt", "hubspot", "salesforce", "openai",
    "chatgpt", "claude", "anthropic", "gemini", "perplexity", "midjourney",
    "notion", "airtable", "monday", "asana", "trello", "slack", "google",
    "microsoft", "apple", "meta", "amazon", "aws", "azure", "vercel",
}

NAVIGATIONAL_ANGLE = "Brand or Feature landing page"


# ---------------------------------------------------------------------------
# Intent Classification
# ---------------------------------------------------------------------------
def classify_intent(keyword: str) -> Tuple[str, str]:
    """
    Classify a single keyword by search intent using regex rules.

    Returns a tuple of (intent_label, content_angle).

    Priority order:
      1. Navigational (branded terms beat all other signals)
      2. Transactional (buy / price / demo signals)
      3. Commercial (best / vs / review signals)
      4. Informational (how / what / guide signals)
      5. Informational (default fallback)
    """
    if not isinstance(keyword, str) or not keyword.strip():
        return "Unclassified", "Skip — invalid input"

    kw_lower = keyword.lower().strip()

    # 1. Navigational check — any token matching a known brand wins.
    tokens = set(re.findall(r"[a-z0-9]+", kw_lower))
    if tokens & BRAND_TERMS:
        return "Navigational", NAVIGATIONAL_ANGLE

    # 2-4. Run rules in priority order.
    for intent_label in ("Transactional", "Commercial", "Informational"):
        rules = INTENT_RULES[intent_label]
        for pattern in rules["patterns"]:
            if re.search(pattern, kw_lower):
                return intent_label, rules["angle"]

    # 5. Fallback — treat ambiguous queries as informational.
    return "Informational", INTENT_RULES["Informational"]["angle"]


# ---------------------------------------------------------------------------
# Embedding & Clustering
# ---------------------------------------------------------------------------
@st.cache_resource(show_spinner=False)
def load_embedding_model():
    """Load the Sentence-BERT model once and cache it across reruns."""
    from sentence_transformers import SentenceTransformer
    # all-MiniLM-L6-v2 is fast (384-dim) and well-suited to short queries.
    return SentenceTransformer("all-MiniLM-L6-v2")


def embed_keywords(keywords: List[str]) -> np.ndarray:
    """Generate normalized embeddings for a list of keywords."""
    model = load_embedding_model()
    embeddings = model.encode(
        keywords,
        batch_size=64,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return np.asarray(embeddings)


def cluster_within_intent(
    keywords: List[str],
    embeddings: np.ndarray,
    similarity_threshold: float,
) -> List[int]:
    """
    Run agglomerative clustering on a set of same-intent keywords.

    Uses cosine distance with average linkage. The distance threshold is
    derived from the user-facing similarity threshold:
        distance_threshold = 1 - similarity_threshold

    Returns a list of cluster labels aligned with the input keyword order.
    """
    n = len(keywords)
    if n == 0:
        return []
    if n == 1:
        return [0]

    distance_threshold = max(1e-6, 1.0 - similarity_threshold)

    clustering = AgglomerativeClustering(
        n_clusters=None,
        metric="cosine",
        linkage="average",
        distance_threshold=distance_threshold,
    )
    labels = clustering.fit_predict(embeddings)
    return labels.tolist()


def select_primary_keyword(
    cluster_keywords: List[str],
    cluster_embeddings: np.ndarray,
) -> str:
    """
    Pick the most representative keyword in a cluster.

    Strategy: maximize mean cosine similarity to other cluster members
    (semantic centrality), then break ties by preferring the shorter,
    more head-term-like keyword.
    """
    if len(cluster_keywords) == 1:
        return cluster_keywords[0]

    sim_matrix = cosine_similarity(cluster_embeddings)
    np.fill_diagonal(sim_matrix, 0.0)
    centrality = sim_matrix.mean(axis=1)

    # Sort by (-centrality, word_count, char_length) — most central, shortest wins.
    ranked = sorted(
        range(len(cluster_keywords)),
        key=lambda i: (
            -centrality[i],
            len(cluster_keywords[i].split()),
            len(cluster_keywords[i]),
        ),
    )
    return cluster_keywords[ranked[0]]


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------
def build_cluster_table(
    raw_keywords: List[str],
    similarity_threshold: float,
) -> pd.DataFrame:
    """
    End-to-end pipeline: clean -> classify -> embed -> cluster (per intent)
    -> pick primary keyword -> assemble output dataframe.
    """
    # 1. Clean and de-duplicate.
    cleaned = []
    seen = set()
    for kw in raw_keywords:
        if not isinstance(kw, str):
            continue
        norm = kw.strip().lower()
        if norm and norm not in seen:
            seen.add(norm)
            cleaned.append(norm)

    if not cleaned:
        return pd.DataFrame()

    # 2. Classify intent for every keyword.
    intent_records = [(kw, *classify_intent(kw)) for kw in cleaned]
    df = pd.DataFrame(intent_records, columns=["keyword", "intent", "angle"])

    # 3. Embed every keyword in one batched call for speed.
    embeddings = embed_keywords(df["keyword"].tolist())
    df["_idx"] = np.arange(len(df))

    # 4. Cluster within each intent group separately to enforce purity.
    df["cluster_local"] = -1
    for intent_label, group in df.groupby("intent"):
        idx = group["_idx"].to_numpy()
        group_embeddings = embeddings[idx]
        labels = cluster_within_intent(
            group["keyword"].tolist(),
            group_embeddings,
            similarity_threshold,
        )
        df.loc[group.index, "cluster_local"] = labels

    # 5. Build a globally unique Cluster ID = "Intent-LocalID".
    df["cluster_key"] = df["intent"] + "::" + df["cluster_local"].astype(str)

    # 6. Aggregate each cluster into one output row.
    output_rows = []
    cluster_counter = 1
    for cluster_key, group in df.groupby("cluster_key"):
        members = group["keyword"].tolist()
        member_idx = group["_idx"].to_numpy()
        member_embeddings = embeddings[member_idx]

        primary = select_primary_keyword(members, member_embeddings)
        supporting = [k for k in members if k != primary]

        output_rows.append({
            "Cluster ID": f"C{cluster_counter:03d}",
            "Primary Keyword": primary,
            "Intent": group["intent"].iloc[0],
            "Suggested Content Angle": group["angle"].iloc[0],
            "Supporting Keywords": ", ".join(supporting) if supporting else "—",
            "Cluster Size": len(members),
        })
        cluster_counter += 1

    out = pd.DataFrame(output_rows)
    # Sort: largest clusters first within each intent, intents grouped together.
    intent_order = ["Commercial", "Informational", "Transactional", "Navigational", "Unclassified"]
    out["_intent_rank"] = out["Intent"].apply(
        lambda x: intent_order.index(x) if x in intent_order else 99
    )
    out = out.sort_values(
        by=["_intent_rank", "Cluster Size"],
        ascending=[True, False],
    ).drop(columns=["_intent_rank"]).reset_index(drop=True)

    # Re-sequence Cluster IDs after sorting so they read top-to-bottom.
    out["Cluster ID"] = [f"C{i+1:03d}" for i in range(len(out))]

    return out


# ---------------------------------------------------------------------------
# Streamlit UI
# ---------------------------------------------------------------------------
def render_sidebar() -> float:
    """Render sidebar controls and return the chosen similarity threshold."""
    st.sidebar.header("⚙️ Controls")
    st.sidebar.markdown(
        "Tune the **similarity threshold** to control cluster tightness. "
        "Higher = fewer, tighter clusters."
    )
    threshold = st.sidebar.slider(
        label="Similarity Threshold",
        min_value=0.50,
        max_value=0.95,
        value=0.72,  # default tuned to prevent over-grouping
        step=0.01,
        help="Cosine similarity cutoff. 0.72 is a balanced default.",
    )
    st.sidebar.markdown("---")
    st.sidebar.caption(
        "Tip: start at 0.72. Bump up if clusters feel too broad, "
        "down if related terms get split apart."
    )
    return threshold


def render_header():
    """Render the page title and intro copy."""
    st.title("🧭 Keyword Intent & Clustering Tool")
    st.markdown(
        "Paste a raw keyword list and instantly get an **intent-pure, "
        "semantically grouped content map** ready for editorial planning."
    )


def render_input() -> List[str]:
    """Render the keyword input area and return parsed keywords."""
    sample = (
        "how to automate workflows with ai\n"
        "what is ai automation\n"
        "best ai automation tools\n"
        "top ai workflow tools 2025\n"
        "zapier vs make\n"
        "n8n alternatives\n"
        "buy ai automation software\n"
        "zapier pricing\n"
        "free trial workflow automation\n"
        "ai agent tutorial\n"
        "how to build an ai agent\n"
        "ai agent examples"
    )
    text = st.text_area(
        label="Keyword list (one per line)",
        value="",
        height=240,
        placeholder=sample,
        help="Paste up to ~500 keywords for best performance.",
    )
    keywords = [line.strip() for line in text.splitlines() if line.strip()]
    return keywords


def render_results(df: pd.DataFrame):
    """Render results dataframe, summary metrics, and the download button."""
    if df.empty:
        st.warning("No clusters generated. Check your input.")
        return

    # Top-line metrics.
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Keywords", int(df["Cluster Size"].sum()))
    col2.metric("Total Clusters", len(df))
    col3.metric("Intents Found", df["Intent"].nunique())
    col4.metric("Avg Cluster Size", f"{df['Cluster Size'].mean():.1f}")

    st.markdown("### 📋 Generated Clusters")
    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Cluster ID": st.column_config.TextColumn(width="small"),
            "Primary Keyword": st.column_config.TextColumn(width="medium"),
            "Intent": st.column_config.TextColumn(width="small"),
            "Suggested Content Angle": st.column_config.TextColumn(width="medium"),
            "Supporting Keywords": st.column_config.TextColumn(width="large"),
            "Cluster Size": st.column_config.NumberColumn(width="small"),
        },
    )

    # Download button — sidebar version for easy access.
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    st.sidebar.download_button(
        label="⬇️ Download CSV",
        data=csv_bytes,
        file_name="keyword_clusters.csv",
        mime="text/csv",
        use_container_width=True,
    )


def main():
    render_header()
    threshold = render_sidebar()
    keywords = render_input()

    run = st.button("🚀 Cluster Keywords", type="primary", use_container_width=False)

    if run:
        if not keywords:
            st.error("Please paste at least one keyword before running.")
            return
        if len(keywords) > 2000:
            st.warning(
                f"You provided {len(keywords)} keywords. Processing may take a moment. "
                "For best speed, keep lists under 500."
            )

        try:
            with st.spinner("Embedding keywords and building intent-pure clusters..."):
                result_df = build_cluster_table(keywords, threshold)
            st.success(
                f"Done — {len(result_df)} clusters built from {len(keywords)} keywords."
            )
            render_results(result_df)
        except Exception as e:
            st.error(f"Something went wrong: {type(e).__name__}: {e}")
            st.caption(
                "If this is the first run, the model may need a moment to download. "
                "Try again."
            )


if __name__ == "__main__":
    main()
