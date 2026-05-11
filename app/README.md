# Plano A — Test App (Person A only)

Meal-planning + logging app calibrated for Person A. Next.js 15 + libSQL (Turso) + Tailwind.

**Quer rodar do celular sem instalar nada?** Veja [`DEPLOY.md`](../DEPLOY.md) na raiz — guia passo a passo pra subir no Vercel + Turso (15 min, free, só navegador).

## What's working

- **Today dashboard** with 6 meal cards (café / lanche manhã / almoço / lanche tarde / jantar / snack noturno).
- **Card state toggle** with 4 alternatives per slot: `Original` / `Fácil` / `Líquido` / `Sem fome`. Single tap cycles between them.
- **Smart defaults driven by overlays**:
  - Cocaine logged yesterday → AM defaults to `liquid` (post-stim recovery)
  - Slept <5h → AM defaults to `liquid`; slept ≥9h → AM defaults to `no_hunger`
  - "Tô cansado da casa hoje" button → all defaults shift to `easy`
  - Prep time chosen ≤5min → `liquid`; ≤15min → `easy`
- **Meal logging** with macro tally per day (kcal / protein progress bars vs target).
- **Sleep input** (4–10h chips, one tap).
- **Substance log** (coca / álcool / cannabis / tabaco / benzo — one tap each, today's date).
- **Prep time today** input.
- **Shopping list** view: split into `🚚 Delivery` and `🚶 Subir`, grouped by store (Forte mensal, Imperatriz semanal, iFood), with per-item weight and total kg load.
- **Profile view**: reads `data/profiles/person_a.yml` and shows targets, restrictions, medical flags.
- **History view**: last 60 logs grouped by day, with kcal + protein totals and state-distribution chips.

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

- **Profile data**: read from `../data/profiles/person_a.yml` at request time (via `js-yaml`).
- **Meal plan**: hardcoded for week 1 in `src/lib/seed-plan.ts`, anchored to Sunday. Calibrated for:
  - Skate days (Sun + Mon): high-carb (~3300 kcal target, refeed pre/post-skate fuel)
  - Work days (Tue–Sat): eucaloric recomp (~2500 kcal, 130g protein)
  - Friday jantar slot: reserved for delivery (acceptable list — never burger junk)
  - Cocaine-aware: Thu and Sat AM defaults to recovery shake when Wed/Fri use is logged
- **DB**: SQLite at `app/data/app.db` (auto-created). Tables: `meal_logs`, `sleep_logs`, `substance_logs`, `fatigue_logs`, `prep_time_logs`.
- **UI**: Mobile-first Tailwind. Dark theme. Server components + server actions (no client-side fetching).

## What's NOT in v1 (intentionally)

- Reconciler (auto-adjusting future days based on deficits) — comes after a week of real logging.
- Habit Analyst — needs ≥7 days of data first.
- Price Scout (iFood/Forte/Imperatriz scraping) — manual pricing for now.
- Multi-person (Persona B) — duplicates trivially once Person A is validated.
- Recipe LLM generation — week 1 is hand-crafted; the Meal Plan Designer agent generates week 2+ once we plug it in.
- Authentication — local-network only, no need.

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
    │   ├── shopping/page.tsx           # Shopping list (split delivery/self-carry)
    │   ├── profile/page.tsx            # Read-only profile + targets
    │   └── history/page.tsx            # Recent logs grouped by date
    ├── components/
    │   ├── MealCard.tsx                # Card with 4-state toggle + log button
    │   └── DayHeader.tsx               # Targets, sleep, prep, fatigue, substance log
    └── lib/
        ├── types.ts                    # MealSlot, CardState, MealVersion, etc.
        ├── db.ts                       # SQLite connection + migrations
        ├── profile.ts                  # YAML loader for person_a.yml
        ├── query.ts                    # Read queries
        └── seed-plan.ts                # Hand-crafted week 1 plan + shopping list
```

## Mobile setup (phone access from same Wi-Fi)

The dev server binds to `0.0.0.0` by default (see `package.json` `dev` script), so any device on the same Wi-Fi can reach it.

1. On your laptop, run `ip addr` (or `ifconfig` on macOS) to find your LAN IP.
2. On your phone, open `http://<that-ip>:3000`.
3. Add to home screen for a native-app feel (Safari: Share → Add to Home Screen; Android Chrome: kebab menu → Add to Home Screen).

## Iteration plan

1. **Week 1** (this app): use it daily, log meals, see what works and what doesn't.
2. **Week 2**: based on what you actually consumed and how you toggled, I'll calibrate week 2 with the lessons learned.
3. **Week 3+**: add the Reconciler (deficit/surplus carry-forward), then the Habit Analyst (pattern reports).
4. **Week 4+**: spin up Persona B with her own profile + cross-meal optimization for the couple.

## Troubleshooting

- **`better-sqlite3` install fails**: needs Node ≥18 and Python + build tools available for the native compile. On Ubuntu: `sudo apt install build-essential python3`. On macOS: `xcode-select --install`.
- **Port 3000 in use**: edit the `dev` script in `package.json` or pass `--port 3001`.
- **Phone can't reach the IP**: check macOS firewall / Windows Defender. Sometimes you need to allow the port explicitly.
- **YAML parse error**: `data/profiles/person_a.yml` got out of sync — restore from git.
