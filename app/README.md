# Meal + Habit Tracker — Starter Kit

Meal-planning + logging app, generic starter kit (no hardcoded personal content). Next.js 15 + libSQL (Turso) + Tailwind.

**Want to run it from your phone without installing anything?** See [`DEPLOY.md`](../DEPLOY.md) at the repo root — step-by-step guide to deploy on Vercel + Turso (~15 min, free, browser only).

See [`HANDOVER.md`](../HANDOVER.md) at the repo root for the full picture: what's built, what's in scope, and how to extend it.

## What's working

- **Today dashboard** with 6 meal cards (café / lanche manhã / almoço / lanche tarde / jantar / snack noturno).
- **Card state toggle** with 4 alternatives per slot: `Original` / `Fácil` / `Líquido` / `Sem fome`. Single tap cycles between them.
- **Smart defaults driven by overlays**:
  - Any substance logged yesterday → AM defaults to `liquid` (post-use recovery)
  - Slept <5h → AM defaults to `liquid`; slept ≥9h → AM defaults to `no_hunger`
  - "Tô cansado da casa hoje" button → all defaults shift to `easy`
  - Prep time chosen ≤5min → `liquid`; ≤15min → `easy`
- **Meal logging** with macro tally per day (kcal / protein progress bars vs target).
- **Sleep input** (4–10h chips, one tap).
- **Substance log** (stimulant / álcool / cannabis / tabaco / benzo — one tap each, today's date).
- **Prep time today** input.
- **Shopping list** view: split into `🚚 Delivery` and `🚶 Subir`, grouped by store, with per-item weight and total kg load — ships with a small generic starter list, replace with your own staples.
- **Profile view**: reads the active profile YAML and shows targets, restrictions, medical flags.
- **History view**: last 60 logs grouped by day, with kcal + protein totals and state-distribution chips.
- **Multi-person (A/B switcher)**: two independent profiles, switchable from the nav — see below.
- **AI Meal Plan Designer** (`/plan`) and **Habit Analyst** (`/analyst`) — see `HANDOVER.md`.

## Quick start (rodar localmente — precisa Node + pnpm instalado)

```bash
cd app
pnpm install
pnpm dev
```

Sem `TURSO_DATABASE_URL` configurado, o app usa um arquivo local em `data/app.db` (funciona em máquina com disco persistente). Pra produção/Vercel, configura `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (veja `.env.example`).

Open `http://localhost:3000`. On your phone, find your laptop's local IP and visit `http://<ip>:3000`.

## Quick start (do celular, sem instalar nada)

Veja [`DEPLOY.md`](../DEPLOY.md) na raiz do repo. Tudo via navegador, ~15 min.

## Architecture

- **Profile data**: read from `../data/profiles/person_a.yml` or `person_b.yml` at request time (via `js-yaml`), depending on which profile is active (nav toggle, cookie-backed).
- **Meal plan**: a small generic starter (`buildGenericSeedPlan` in `src/lib/seed-plan.ts`) shows until you generate a real plan. Real plans come from **either**:
  - Manually filling in `data/recipes/seed.md` and hand-building your own week (mirror the pattern that used to live in `seed-plan.ts` if you want hardcoded content again), or
  - The **AI Meal Plan Designer** (`/plan` → "Gerar com IA"), which reads your filled-in profile YAML + your last 7 days of logs and calls Claude for a full 7-day plan.
- **DB**: libSQL (Turso in production, local SQLite file in dev). Tables: `meal_logs`, `sleep_logs`, `substance_logs`, `fatigue_logs`, `prep_time_logs`, `beverage_logs`, `weekly_plans` — every table is scoped by `person_id` (`person_a` | `person_b`).
- **UI**: Mobile-first Tailwind. Dark theme. Server components + server actions (no client-side fetching).

## Multi-person

Both Person A and Person B share this deployment. A profile switcher (A / B chips)
in the nav sets which person is active; every meal log, sleep/substance log, AI
meal plan, and Habit Analyst view is scoped to the active person. The shopping
list stays combined — one household, one shop.

## What's NOT in v1 (intentionally)

- Price Scout (iFood/Forte/Imperatriz scraping) — manual pricing for now.
- Authentication — anyone with the deployed link can use it; fine for a private household tool, not for anything more public.
- Hand-crafted, personalized meal content — this starter kit ships with a generic placeholder plan on purpose. Fill in your profile and use the AI Meal Plan Designer, or write your own `buildWeeklyPlan`-style function once you know what you actually want to eat.

## File map

```
app/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── README.md
└── src/
    ├── app/
    │   ├── layout.tsx                  # Top nav + container
    │   ├── globals.css                 # Tailwind + design tokens
    │   ├── actions.ts                  # Server actions (log meal, sleep, etc.)
    │   ├── page.tsx                    # Today dashboard
    │   ├── plan/page.tsx               # AI Meal Plan Designer
    │   ├── analyst/page.tsx            # Habit Analyst (7/14/30-day rollup)
    │   ├── shopping/page.tsx           # Shopping list (split delivery/self-carry)
    │   ├── profile/page.tsx            # Read-only profile + targets
    │   └── history/page.tsx            # Recent logs grouped by date
    ├── components/
    │   ├── MealCard.tsx                # Card with 4-state toggle + log button
    │   ├── DayHeader.tsx                # Targets, sleep, prep, fatigue, substance log
    │   └── PersonToggle.tsx            # A/B active-profile switcher
    └── lib/
        ├── types.ts                    # MealSlot, CardState, MealVersion, PersonId, etc.
        ├── db.ts                       # DB connection + migrations (person_id-scoped)
        ├── profile.ts                  # YAML loader for both profiles
        ├── person.ts                   # Active-person cookie helper
        ├── query.ts                    # Read queries (all person_id-scoped)
        ├── meal-plan-ai.ts             # Claude-driven weekly plan generation
        ├── habits.ts                   # Habit Analyst rollup logic
        ├── predictions.ts              # 3-day rolling predictions banner
        └── seed-plan.ts                # Generic starter plan + starter shopping list
```

## Mobile setup (phone access from same Wi-Fi)

The dev server binds to `0.0.0.0` by default (see `package.json` `dev` script), so any device on the same Wi-Fi can reach it.

1. On your laptop, run `ip addr` (or `ifconfig` on macOS) to find your LAN IP.
2. On your phone, open `http://<that-ip>:3000`.
3. Add to home screen for a native-app feel (Safari: Share → Add to Home Screen; Android Chrome: kebab menu → Add to Home Screen).

## Iteration plan

1. **Fill in your profile(s)**: `data/profiles/person_a.yml` and/or `person_b.yml` — this is what unlocks real targets, the AI plan, and the Habit Analyst.
2. **Week 1**: use it daily, log meals, see what works and what doesn't.
3. **Week 2+**: generate a plan with the AI Meal Plan Designer from your logs + profile, or hand-write your own.
4. **Ongoing**: Reconciler (predictions banner) adjusts each day; Habit Analyst surfaces 7/14/30-day patterns.

## Troubleshooting

- **`better-sqlite3`/native module install fails**: needs Node ≥18 and Python + build tools available for the native compile. On Ubuntu: `sudo apt install build-essential python3`. On macOS: `xcode-select --install`.
- **Port 3000 in use**: edit the `dev` script in `package.json` or pass `--port 3001`.
- **Phone can't reach the IP**: check macOS firewall / Windows Defender. Sometimes you need to allow the port explicitly.
- **YAML parse error**: a profile file got out of sync — restore from git or re-copy the template structure.
