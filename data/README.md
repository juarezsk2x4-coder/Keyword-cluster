# Data templates

Source of truth for the meal-planning agents. Edit these YAML files by hand; the agents read them.

## Filling order

1. `profiles/person_a.yml` and `profiles/person_b.yml` — anthropometrics, activity, substances
2. `preferences.yml` — likes, dislikes, hard restrictions
3. `logistics.yml` — kitchen, storage, stores, budget
4. `pantry.yml` — what's already in the kitchen *right now*
5. `recipes/seed.md` — 5–15 recipes you already rotate through (optional but recommended)

## Hard rules already baked in

- **Tomate (tomato) is a hard block** — no tomato in any form: in natura, molho, extrato, ketchup, sugo, conservas. The Meal Plan Designer will refuse any recipe containing tomato.
- All grocery output uses **pt-BR sulista** vocabulary (aipim, bergamota, vagem, pão francês, etc.).
- Couple is in **recomp** (eucaloric, body composition focus). Targets calculated per person from their profile.
- Cook time target: **~30 min/day, batch-cook on Sunday**.
- Meal structure: **3 meals + 2 snacks** (pre/post training).
- Shopping cadence: **bi-weekly bulk run** (Forte / Imperatriz) **+ weekly produce** + iFood top-ups.

## Conventions

- `FILL_IN` markers are the only required edits. Anything pre-filled is a sensible default — change if it doesn't match.
- Booleans: `true` / `false` (lowercase).
- Dates: ISO 8601 (`YYYY-MM-DD`).
- Times: `"HH:MM"` 24-hour, in quotes.
- Quantities: decimal with dot, not comma (`1.5`, not `1,5`). Units in metric.
- Comments (`#`) explain a field; safe to leave or delete.

## Wife edition

If your partner is filling her side separately, send her the `wife/` folder. It contains only the files she needs to touch, with instructions in Portuguese.
