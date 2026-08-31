# Keyword-cluster

This repo currently hosts two unrelated projects — the name is a leftover
from whatever this repo was originally created for; neither project below
matches it.

## Meal-planning + habit-tracker app (`app/`)

The actual active project — a Next.js 15 web app for meal planning, habit
logging, and AI-assisted plan generation. See [`app/README.md`](app/README.md)
for what it does, [`DEPLOY.md`](DEPLOY.md) for how to deploy it, and
[`SECURITY.md`](SECURITY.md) for the secret-handling model.

Supporting content for the app lives alongside it at the repo root:

- `data/` — profile YAMLs, household logistics, recipes the app reads
- `agents/` — design docs for the app's UX patterns
- `wife/` — a plain-language, non-technical onboarding template

## OSINT Sanctions Intelligence Tool (`osint_tool.py`)

A standalone Streamlit app for sanctions-related research (manual name
search + document analysis), unrelated to the meal-planning app — different
language (Python vs. TypeScript), different purpose, no shared code. Run
locally with `pip install -r requirements.txt && streamlit run osint_tool.py`.
