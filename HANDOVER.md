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

## Pre-handover QA pass

Before finalizing this handover, the whole codebase (not just the diff that
stripped personal content) got a full read-through — every file under
`app/src`, correctness bugs, security, data integrity, code quality,
performance, type safety. Here's what that found and what was actually
changed as a result, so you know what you're inheriting and don't have to
re-discover any of it yourself.

**Fixed — real bugs:**

- **DB migration wasn't transactional.** The one-time upgrade that adds
  `person_id` to a pre-existing database (`app/src/lib/db.ts`,
  `migrateLegacyTables`) ran its rename→create→copy→drop→rename sequence as
  separate statements with no rollback — a dropped connection mid-migration
  could delete a table and never finish its replacement. Now wrapped in a
  real transaction (`client.batch(..., "write")`); re-tested against a
  simulated pre-existing database (real rows, old schema) to confirm data
  still survives intact.
- **"Today" was computed in server time (UTC), not the household's actual
  timezone**, duplicated across six files. On Vercel that meant a meal
  logged at 9–11pm in Brazil got silently attributed to tomorrow. Centralized
  into `app/src/lib/dates.ts` (fixed to `America/Sao_Paulo` — change the one
  constant there if that's ever not the right timezone) and every caller now
  imports it instead of re-deriving `new Date().toISOString()`.
- **Two delete actions weren't scoped by the active profile.**
  `deleteSubstanceLog`/`deleteBeverageLog` in `app/src/app/actions.ts` could
  delete a row belonging to the *other* profile, breaking the person-isolation
  every other action in that file respects. Both now filter by `person_id`
  like the rest.
- **AI plan generation was at real risk of failing on its own output size** —
  a 7-day, 4-alternative-per-slot plan is a large structured response, and it
  was using a non-streaming call with a token budget tight enough to
  plausibly truncate mid-JSON. Switched to `.stream().finalMessage()` with a
  larger budget, and a truncated response now surfaces a clear "ran out of
  output space, try again" error instead of an opaque JSON-parse failure.
- **An unfilled profile could turn every stat into a literal "NaN%"** in the
  Habit Analyst and predictions banner, since nothing guarded against
  dividing by a zero/invalid target. Both now fall back to no-insight instead
  of garbage output.
- **No startup check for a missing database URL in production** — without
  `TURSO_DATABASE_URL` set, the app would silently fall back to a local
  SQLite file that doesn't persist on Vercel, failing unpredictably deep
  inside a random request instead of with a clear message. Now throws a
  specific, actionable error at startup when running on Vercel without it.
- **Hardened (not proven broken) the profile YAML loading path** — it reads
  `../data/profiles/*.yml` via `fs` at request time with a dynamically-built
  path, which Vercel's serverless bundler can't always statically trace.
  This has been working in production throughout this whole project, so it
  isn't a confirmed outage, but it's a fragile pattern worth not leaving to
  chance — `next.config.mjs` now explicitly force-includes those files in
  the deployed function bundle regardless of what the tracer infers.

**Fixed — smaller correctness/consistency issues:**

- Notification on/off preference was stored under one `localStorage` key
  shared by both profiles — switching profiles silently changed the other
  profile's notification setting. Now namespaced per profile.
- `/history` fetched a fixed row count (`LIMIT 60`) rather than a day range,
  which could cut a day's meals in half with no indication it was partial.
  Switched to a proper 14-day window, matching the pattern every other
  "recent" query in the codebase already uses.
- Free-text kcal/protein entry (the "ate something else" form) had no
  validation — non-numeric input silently became `NaN` and could reach the
  database. Now validated both client- and server-side.
- Cookies (`lang`, `person`) didn't set the `Secure` flag. Added, gated to
  production only — local phone-over-Wi-Fi testing (see `app/README.md`
  "Mobile setup") uses plain HTTP, which a `Secure` cookie would never be
  sent back over.
- Cleaned up duplication: the "get today's date" / "get this week's Sunday"
  helpers were copy-pasted across 4+ files, and the Anthropic API client
  singleton was duplicated between the two AI-calling modules. Both
  consolidated into single shared modules (`lib/dates.ts`,
  `lib/anthropic-client.ts`).
- Removed dead weight: an npm script pointing at a `scripts/seed.ts` that
  doesn't exist in this repo, two unused dependencies (`date-fns`, `zod`),
  and an unused query function left behind by the `/history` fix above.

**Deliberately left alone, with reasoning:**

- **Did not cache the profile YAML in memory**, despite it being re-read and
  re-parsed on every request. It's cheap (single-digit KB, single-digit ms),
  and caching it would break the exact workflow this handover teaches:
  "edit your profile YAML, refresh the page, see it reflected." A stale
  in-memory cache would silently show old values until the server process
  restarted — a worse bug than the I/O it would save.
- **Did not delete the "skate day" / high-activity-day machinery**
  (`is_skate_day`, `total_kcal_target_skate_day`) even though nothing in
  this starter kit currently sets it to `true`. It's a real, working
  extension point — write your own plan builder that varies it per day (the
  way the original hand-authored plan did) and the kcal-target logic already
  knows what to do with it. Left a comment on the type explaining this so
  it doesn't read as leftover cruft.
**Verified after every fix:** `pnpm build` and `npx tsc --noEmit` clean, a
full route smoke test (all 6 pages, both profiles, completely blank
templates) with nothing crashing, and the migration re-tested end-to-end
against a simulated pre-existing database to confirm the transactional
rewrite still upgrades an old schema correctly.

## Second pass: architecture + design review, and the fixes from it

After the QA pass above, this codebase got two independent expert reviews —
one from a senior-tech-lead angle (architecture, maintainability), one from
a dietitian + DBT-informed therapist angle (nutrition science, behavioral
design) — each scoring 6/10 and producing a ranked fix list. Everything
generic from that list (not tied to anyone's personal recipe/clinical
content, which this starter kit never had to begin with) is implemented
here too:

- **AI model choice, per use case, not just "the newest one"**: quick
  free-text nutrition estimation (blocking UI, bounded task) now runs
  `claude-sonnet-5`; weekly plan generation (async, many simultaneous hard
  constraints) runs `claude-opus-5`. Both are newer than the
  `claude-opus-4-7` this was originally pinned to either way.
- **Profile YAML validated with zod** at load time — catches a genuinely
  malformed hand-edit (wrong shape, missing section) with a clear error
  instead of a crash three files away, while still accepting the `FILL_IN`
  placeholder on numeric fields so an unfilled template renders fine.
- **A new "consider_professional_support" habit insight** — every existing
  pattern-detection insight resolved to "log more" with no path to "talk to
  a human." This one fires (only on 14/30-day windows, only when multiple
  severe signals compound at once — chronic deficit, or easy-dominance +
  frequent fatigue, or escalating substance-use frequency) with language
  that points toward your actual doctor/therapist instead.
- **Missed-meal alerting is now sleep-aware**: a 9h+ sleep night no longer
  counts the morning slots you slept through as "missed" for alerting
  purposes — avoids flagging a legitimate long-sleep morning as neglect.
- **A "syncope risk" insight exists as generic infrastructure**: if your
  own plan ever sets a day as high-intensity/hard-training AND you've
  logged a stimulant in the last 3 days, it surfaces automatically with
  extra hydration guidance. Inert until you use it — the generic starter
  plan never sets a high-intensity day — but it's there and tested.
- **Migration failures now self-heal**: if the one-time legacy-schema
  migration throws (dropped connection, etc.), the failure is logged and
  the next request gets a fresh retry instead of being permanently stuck.

Not ported here (real personal content this copy never had): rebalancing
specific hand-authored recipes, making a specific person's AI prompt
log-driven instead of day-of-week-hardcoded, removing supplement dosing
language from a clinical file, building a specific chicken-allergy
fallback recipe. Those fixes exist on the original build this was forked
from, not here, because the content they touch was deliberately stripped
out of this starter kit in the first place.

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
