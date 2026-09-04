# Changelog

Notable changes to the meal-planning app, most recent first. Grouped by day
rather than version numbers — this is a personal app, not a released
product. Full detail for every change lives in `git log` on `main`; this
file is the readable summary.

## 2026-09-04

- **Exercise log**: tap to record what you did each day (Skate, Pilates,
  Musculação, or free-text "other"). Skate asks for the session length in
  minutes, because a session can run 20 minutes or three hours and one flat
  calorie figure for it was meaningless.
- **Calories spent**: logging exercise now raises that day's kcal target on
  the home page and shows the spend explicitly ("Gasto com exercício
  hoje"), instead of the target ignoring exercise entirely. Skate is
  costed per minute (7.22/min); Pilates and Musculação stay flat per
  session.
- **Exercise and supplements on History and Analyst**: previously both
  vanished from view the moment a day stopped being "today". History now
  shows them per day (a day with only exercise logged gets its own card,
  which it didn't before), and Analyst gained exercise days, streak, total
  kcal spent, supplement adherence, and a day-by-day kcal-spent trend
  chart across the 7/14/30-day window.
- **Calendar feed**: a token-protected iCal subscription of meal times and
  skate days, so the plan can appear in Google/Apple Calendar.
- **Fixes from a full QA pass**:
  - Date maths ran in the server's local timezone and was read back as
    UTC, so on any host east of UTC every date shifted back a day and the
    home page rendered Sunday's skate plan (3300 kcal) all week. Production
    on Vercel runs UTC and was unaffected; local development wasn't.
  - Weekday meal plans printed 3040–3160 kcal of food against their own
    2500 kcal target, so eating exactly what the app said logged as ~24%
    overeating and triggered a "go lighter today" warning. Two oversized
    snacks trimmed; every day now lands within 9% of its target.
  - Trend maths compared a mixed skate/rest week against the flat rest-day
    target, so a correctly fuelled skate day read as a surplus.
  - A "3+ days of easy meals" warning could never fire (the window only
    ever held two days), and some recommended adjustments appeared with no
    text explaining them.
  - Switching to Person B rendered "NaN kcal" everywhere, because the
    unfilled profile placeholders were used in arithmetic.
  - Beverage times were rendered in the server's timezone during SSR and
    the browser's afterwards — a hydration mismatch that showed the wrong
    hour.
  - Meal cards kept the previous day's state when navigating between days.
  - The weather cache was keyed by date only, so two people in different
    cities would share one forecast.
  - Exercise and supplement entries didn't refresh History or Analyst.
  - A stored AI plan was trusted after a length check alone; a malformed
    one could render a NaN ring.
- **Tests**: added a Vitest suite (67 tests) covering the date maths,
  calorie estimates, plan/target invariants, prediction thresholds, habit
  rollups and PT/EN dictionary parity. It runs under a non-UTC timezone on
  purpose so the timezone bug class above cannot come back unnoticed.

## 2026-09-01

- **Daily supplement tracker**: a new checklist on the home page for the
  currently prescribed supplements (Fisiogen Ferro Forte, B Complex, Sany
  D, Multivitamínico) — tap to mark one taken for the day, tap again to
  undo. Driven by a new `daily_supplements` list in the profile, so it's
  easy to update when the regimen changes.
- Reset stale activity data (`caminhada`, `racing_sim_direct_drive`) back
  to fill-in-later, and removed the "sex" activity entry.
- Reset the stimulant-use fields in the profile (frequency, phase, typical
  days) that no longer reflected reality — cleared rather than guessed at.
- Moved the work schedule to Monday–Friday (was Tuesday–Saturday) and the
  skate-day anchor to weekends (was Sunday/Monday), in the actual served
  plan and the AI prompt, not just the profile data.
- Wired the doctor's newer meal ideas (lentil soup, a vegetarian quinoa
  bowl, a wrap, a homemade burger, a vegan protein shake) into the real
  weekly plan — an earlier data-only update had missed this.
- Removed the unrelated OSINT tool from the repo, leaving just this app.

## 2026-08-31

- Merged months of accumulated work to production in one pass: multi-person
  (A/B) support with a profile switcher, a substantial QA-hardening pass
  (transactional DB migrations, timezone fixes, safer deletes, AI-output
  truncation guard, and more), full i18n cleanup, an AI-model swap
  (Sonnet for quick nutrition estimates, Opus for full weekly plans), and
  renaming the "cocaine" substance category to a generic "stimulant."
- Added a daily weather lookup (Open-Meteo) with a "good skate weather"
  nudge on sunny days.
- Incorporated new bloodwork, an InBody body-composition reading, and an
  updated prescription into the profile and clinical notes.

## 2026-05-11 to 2026-05-20 (initial build)

- Built the original single-person meal-planning app: daily meal cards
  with four alternatives per slot (original/easy/liquid/no-hunger), a
  hand-authored weekly plan, PT/EN toggle, free-text meal logging with AI
  nutrition estimation, beverage and substance logging, meal-time
  notifications, an LLM-generated weekly-plan option, a habit analyst, and
  a predictions/reconciler banner.
- Deployed to Vercel with libSQL (Turso) as the database.
