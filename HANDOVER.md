# Handover — this is now your project

This repo is a full copy of the meal-planning + habit-tracker app, handed over
so you own it outright: your own code, your own deployment, your own data.
Nothing here points back at anyone else's account, database, or personal
information — see "What was cleaned up for this handover" below.

## What this is, in one paragraph

A mobile-first web app (Next.js, deployed free on Vercel) for logging meals,
sleep, substances, and energy — with an AI ("Meal Plan Designer") that reads
your filled-in profile plus your last week of logs and generates a real 7-day
meal plan, and a "Habit Analyst" that surfaces 7/14/30-day patterns (what you
tend to skip, whether your intake dips on certain days, etc). It supports two
independent profiles (A/B) sharing one deployment with a combined shopping
list, in case that's ever useful to you — or ignore the second slot entirely.

## Start here

1. **Fill in your profile.** Open `wife/LEIA-ME.md` first — it's a
   friendly, non-technical, Portuguese walkthrough of two simple files
   (`wife/meu-perfil.yml`, `wife/minhas-preferencias.yml`). Fill those in,
   then either:
   - ask Claude Code (or any AI assistant with repo access) to transcribe
     your answers into `data/profiles/person_a.yml` — that's the file the
     app actually reads — or
   - edit `data/profiles/person_a.yml` directly yourself (same fields, English
     keys, more comments explaining each one).
2. **Deploy it** (~15 minutes, free, browser only): follow `DEPLOY.md` at
   the repo root. It walks through Vercel (hosting) + Turso (database) +
   optionally Anthropic (for the AI features).
3. **Move this repo to your own GitHub account** (see "Taking ownership"
   below) — right now it lives under the account that built it for you.
4. **Use it daily for a week or two**, then try "Generate with AI" on the
   `/plan` page — it gets meaningfully better once it has real logs to learn
   from.

## What's built (current scope)

- **Today dashboard** — 6 meal slots/day, each with 4 quick alternatives
  (full version / easy / liquid / minimal) so a bad day doesn't break the
  whole plan.
- **AI Meal Plan Designer** (`/plan`) — generates a full week from your
  profile + recent logs via Claude. Needs `ANTHROPIC_API_KEY`.
- **Habit Analyst** (`/analyst`) — 7/14/30-day rollups: average kcal/protein,
  most-skipped meal slots, how often you pick the "easy" alternatives,
  substance/sleep correlations.
- **Predictions banner** — a lighter 3-day rolling adjustment (protein/kcal
  deficit catch-up, hydration bump after a short-sleep or substance day).
- **Sleep, substance, prep-time, and beverage logging** — quick one-tap
  inputs that drive the smart defaults above.
- **Shopping list** — split into delivery vs. self-carry, grouped by store,
  with per-item weight — ships with a small generic example list; replace
  it with your own regulars (see `app/src/lib/seed-plan.ts`).
- **Two-profile support (A/B)** — a chip in the nav switches the active
  profile; every log and every generated plan is scoped to whichever
  profile is active. The shopping list is the one thing that stays combined.
- **PT-BR / EN toggle** for the whole UI.
- **Mobile-friendly, no login required** — add it to your home screen like a
  native app. (No login also means: don't share the link publicly.)

## What's explicitly NOT built yet

- **Price Scout** — automatic price comparison across delivery apps/stores.
  Not started; manual pricing for now.
- **Authentication** — anyone with the URL can use the app. Fine for a
  private link you control; not fine if you ever want to share it more
  broadly without more work.
- **Hand-crafted personalized meal content** — the original build had ~40
  specific hand-written recipes and a real household shopping list; those
  were intentionally stripped out of this copy (see below) since they
  weren't yours. What ships instead is a small generic placeholder plan,
  meant to be replaced by either the AI generator or your own recipes in
  `data/recipes/seed.md`.

## What was cleaned up for this handover

- **Both profile YAMLs are blank templates** (`data/profiles/person_a.yml`
  and `person_b.yml`) — no one's real anthropometrics, medications,
  substance history, or clinical notes are in this repo. Fill in whichever
  slot(s) you actually want to use.
- **The real clinical write-up file was removed entirely** (it existed only
  for the original person's use).
- **Household logistics were blanked** (`data/logistics.yml`) — floor
  number, delivery address, budget, and specific store branches are now
  `FILL_IN` placeholders instead of someone else's real household details.
- **The hand-authored weekly meal plan and shopping list were removed**
  from `app/src/lib/seed-plan.ts` and replaced with a small, generic,
  non-personal starter (see "What's explicitly NOT built yet" above).
- **No logged data ships with this repo.** Meal/sleep/substance/plan history
  lives in the database (Turso), not in git — since you're setting up your
  own fresh database from `DEPLOY.md`, it starts completely empty. There is
  nothing to "clear" because nothing was ever committed to git in the first
  place (verified — no database files exist anywhere in this repo's history).
- **Small translation bugs were fixed** across the UI (a handful of PT
  strings that were accidentally left in English, non-conditional
  accessibility labels, etc.) so the PT/EN toggle is consistent everywhere
  in the app's interface. The one remaining gap: any meal content you or the
  AI generate will be in whichever language you write/prompt it in — the UI
  chrome (buttons, labels, nav) toggles independently of that.

## Taking ownership

This repo currently lives under the GitHub account that built it for you.
To make it truly yours:

1. Ask whoever gave you this link to go to **Settings → General → Danger
   Zone → Transfer ownership** on the repo, and transfer it to your GitHub
   account (you'll need a GitHub account — free, two minutes to make one at
   github.com if you don't have one).
2. Once transferred, go to **Settings → General** and rename the repo to
   whatever you'd like — it has no reason to carry the old name.
3. In Vercel, disconnect the old project's GitHub link (if one exists) and
   import the repo fresh under your own Vercel account (`DEPLOY.md` covers
   this from scratch).
4. Make sure `ANTHROPIC_API_KEY` and `TURSO_AUTH_TOKEN` are set under
   **your own** Vercel account's Environment Variables, not reused from
   anyone else's — each service's free tier is generous enough for personal
   use, so there's no reason to share credentials.

If a GitHub transfer isn't practical for some reason, the fallback is: clone
this repo, create a brand-new empty repo under your own account, and push
this code to it (`git remote set-url origin <your-new-repo-url> && git push
-u origin main`) — you lose the commit history doing it this way, but you
keep 100% of the code and data files.

## Extending it — your own way

Everything here is meant to be a starting point, not a fixed system:

- **Recipes**: `data/recipes/seed.md` has a fill-in template. Once you have
  a handful of real recipes there, you (or an AI assistant) can hand-write a
  `buildWeeklyPlan`-style function in `app/src/lib/seed-plan.ts` the way the
  original build did — or just rely on the AI generator, which improves as
  it reads more of your logs.
- **The AI prompt** lives in `app/src/lib/meal-plan-ai.ts`
  (`buildSystemPrompt`) — fully editable in plain text if you want to steer
  the AI's food philosophy, add cuisine preferences, or change portion-size
  assumptions.
- **New habit insights**: `app/src/lib/habits.ts` and `predictions.ts` are
  plain TypeScript functions computing patterns from your logs — add your
  own rules the same way the existing ones (chronic-under-kcal, weekday-dip,
  etc.) are written.
- **Design notes**: `agents/meal-card-state-toggle.md` explains the
  reasoning behind the 4-state meal-card pattern (original/easy/liquid/
  no-hunger) — useful background if you want to add a 5th state or change
  the defaults logic in `app/src/app/page.tsx`.
- **Price Scout, authentication, or anything else not built**: there's no
  code to fight with — build it however makes sense to you.

## A note on privacy

The app has no login. Anyone with your deployed URL can open it and see (and
add to) whatever profile is active. That's a reasonable tradeoff for a
private link only you and people you trust have — just don't post the URL
anywhere public. Your `ANTHROPIC_API_KEY` and `TURSO_AUTH_TOKEN` should only
ever live in Vercel's Environment Variables, never in a commit, an issue, or
a chat message — `app/.env.example` in this repo has only placeholder values,
never real ones.
