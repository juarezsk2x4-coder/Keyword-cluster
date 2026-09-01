# Changelog

Notable changes to the meal-planning app, most recent first. Grouped by day
rather than version numbers — this is a personal app, not a released
product. Full detail for every change lives in `git log` on `main`; this
file is the readable summary.

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
