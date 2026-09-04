# Plano A — Test App

Meal-planning + logging app, shared between two profiles via an A/B switcher — plan and targets are calibrated per active profile. Next.js 15 + libSQL (Turso) + Tailwind.

**Quer rodar do celular sem instalar nada?** Veja [`DEPLOY.md`](../DEPLOY.md) na raiz — guia passo a passo pra subir no Vercel + Turso (15 min, free, só navegador).

## What's working

- **Today dashboard** with 6 meal cards (café / lanche manhã / almoço / lanche tarde / jantar / snack noturno).
- **Card state toggle** with 4 alternatives per slot: `Original` / `Fácil` / `Líquido` / `Sem fome`. Single tap cycles between them.
- **Smart defaults driven by overlays**:
  - Stimulant logged yesterday → AM defaults to `liquid` (post-stim recovery)
  - Slept <5h → AM defaults to `liquid`; slept ≥9h → AM defaults to `no_hunger`
  - "Tô cansado da casa hoje" button → all defaults shift to `easy`
  - Prep time chosen ≤5min → `liquid`; ≤15min → `easy`
- **Meal logging** with macro tally per day (kcal / protein progress bars vs target).
- **Sleep input** (4–10h chips, one tap).
- **Substance log** (stimulant / álcool / cannabis / tabaco / benzo — one tap each, today's date).
- **Prep time today** input.
- **Shopping list** view: split into `🚚 Delivery` and `🚶 Subir`, grouped by store (Forte mensal, Imperatriz semanal, iFood), with per-item weight and total kg load.
- **Profile view**: reads the active person's profile (`data/profiles/person_a.yml` or `person_b.yml`, via `loadProfile(personId)`) and shows targets, restrictions, medical flags.
- **History view**: last 14 days of logs grouped by day, with kcal + protein totals and state-distribution chips, plus that day's exercise (with duration and kcal spent) and supplements.
- **Daily supplement checklist**: tap to mark each prescribed supplement taken, driven by `daily_supplements` in the profile.
- **Exercise log**: tap to record Skate / Pilates / Musculação or a free-text "other". Duration-variable exercises (Skate) ask for minutes, and the day's kcal target rises by what was spent — shown explicitly on the home page.
- **Habit Analyst**: 7/14/30-day rollups — averages, day-of-week breakdown, most-missed slots, state distribution, exercise days/streak/kcal-spent trend, supplement adherence, and pattern insights.
- **Calendar feed**: token-protected iCal subscription (`/api/calendar/[personId]?token=…`) publishing meal times and skate days to Google/Apple Calendar. Requires `CALENDAR_FEED_TOKEN`; without it the route denies everyone.

## Tests

```bash
pnpm test        # Vitest suite (pure logic + DB-backed rollups)
pnpm typecheck   # tsc --noEmit
```

The suite runs under `TZ=Asia/Tokyo` deliberately: the date helpers must not
depend on the host timezone, and running east of UTC is what catches it when
they do.

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

- **Profile data**: read from the active person's YAML (`../data/profiles/person_a.yml` or `person_b.yml`, selected by the A/B toggle's cookie) at request time (via `js-yaml`).
- **Meal plan**: hardcoded for week 1 in `src/lib/seed-plan.ts`, anchored to Sunday. Calibrated for:
  - Skate days (Sat + Sun): high-carb (~3300 kcal target, refeed pre/post-skate fuel)
  - Work days (Mon–Fri): eucaloric recomp (~2500 kcal, 130g protein)
  - Friday jantar slot: reserved for delivery (acceptable list — never burger junk)
  - Stimulant-aware: the morning after any logged use defaults to a recovery shake
- **DB**: Turso (libSQL) in production via `TURSO_DATABASE_URL`; falls back to a local SQLite file at `app/data/app.db` for development. Tables: `meal_logs`, `sleep_logs`, `substance_logs`, `fatigue_logs`, `prep_time_logs`, `beverage_logs`, `supplement_logs`, `exercise_logs`, `weekly_plans`, `weather_cache`.
- **UI**: Mobile-first Tailwind. Light and dark themes, following the device setting via CSS custom properties. Server components + server actions (no client-side fetching).
- **Dates**: all "what day is it" logic is pinned to `APP_TIMEZONE` (America/Sao_Paulo) in `src/lib/dates.ts`, not the server clock.

## Multi-person

Both Person A and Person B share this deployment. A profile switcher (A / B chips)
in the nav sets which person is active; every meal log, sleep/substance log, AI
meal plan, and Habit Analyst view is scoped to the active person. The shopping
list stays combined — one household, one shop.

## What's NOT in v1 (intentionally)

- Price Scout (iFood/Forte/Imperatriz scraping) — manual pricing for now.
- Application-level authentication. The app itself has no login: access is
  controlled by Vercel Deployment Protection (Vercel Authentication), which is
  enabled on this project. That covers `*.vercel.app`, but **not** a custom
  domain if one is ever attached — `/profile` shows medical flags and the
  calendar token, so check protection before pointing a domain at this.
- Background meal reminders. Notifications are scheduled with `setTimeout` and
  therefore only fire while the app is open in the foreground; locking the phone
  stops them. Fixing this properly needs a service worker.

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
        ├── profile.ts                  # YAML loader for the active person's profile (person_a.yml / person_b.yml)
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
2. **Week 2+**: the AI Meal Plan Designer generates the plan from the previous week's logs and your profile.
3. **Ongoing**: Reconciler (predictions banner) adjusts each day; Habit Analyst surfaces 7/14/30-day patterns.
4. **Person B**: fill in `data/profiles/person_b.yml`, switch to her profile with the A/B toggle in the nav, and repeat the same loop independently.

## Troubleshooting

- **Port 3000 in use**: edit the `dev` script in `package.json` or pass `--port 3001`.
- **Phone can't reach the IP**: check macOS firewall / Windows Defender. Sometimes you need to allow the port explicitly.
- **YAML parse error**: `data/profiles/person_a.yml` or `person_b.yml` got out of sync — restore from git.
