import { describe, it, expect } from "vitest";
import { buildWeeklyPlan, buildGenericSeedPlan } from "./seed-plan";
import { MEAL_SLOTS } from "./types";
import type { PersonProfile } from "./types";
import { dowForIso } from "./dates";

const WEEK_START = "2026-08-30"; // a Sunday

describe("buildWeeklyPlan structure", () => {
  const days = buildWeeklyPlan(WEEK_START);

  it("returns 7 consecutive days starting on the given Sunday", () => {
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.date)).toEqual([
      "2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02",
      "2026-09-03", "2026-09-04", "2026-09-05",
    ]);
    expect(days.map((d) => dowForIso(d.date))).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("gives every day all six meal slots", () => {
    for (const day of days) {
      expect(day.meals.map((m) => m.slot).sort()).toEqual([...MEAL_SLOTS].sort());
    }
  });

  it("gives every meal all four alternatives", () => {
    for (const day of days) {
      for (const meal of day.meals) {
        for (const state of ["original", "easy", "liquid", "no_hunger"] as const) {
          expect(meal.alternatives[state], `${day.date} ${meal.slot} ${state}`).toBeTruthy();
          expect(meal.alternatives[state].kcal).toBeGreaterThan(0);
        }
      }
    }
  });
});

// The regression this pins: every Mon-Fri plan summed 3040-3160 kcal against
// its own declared 2500 kcal target (+22% to +26%). Eating exactly what the app
// printed therefore logged as overeating and tripped the kcal_surplus insight,
// which fires at >= +15%. Skate days were fine, so the mismatch was invisible
// unless you summed the weekday cards by hand.
describe("a day's planned meals match that day's own targets", () => {
  const days = buildWeeklyPlan(WEEK_START);

  it.each(days.map((d) => [d.day_of_week, d] as const))(
    "%s: original meals land within 10%% of kcal_target",
    (_label, day) => {
      const total = day.meals.reduce((sum, m) => sum + m.alternatives.original.kcal, 0);
      const driftPct = ((total - day.kcal_target) / day.kcal_target) * 100;
      expect(Math.abs(driftPct), `${total} kcal vs target ${day.kcal_target}`).toBeLessThanOrEqual(10);
    }
  );

  it.each(days.map((d) => [d.day_of_week, d] as const))(
    "%s: never drifts far enough over target to trip its own kcal_surplus warning",
    (_label, day) => {
      const total = day.meals.reduce((sum, m) => sum + m.alternatives.original.kcal, 0);
      const overPct = ((total - day.kcal_target) / day.kcal_target) * 100;
      expect(overPct, `${total} kcal vs target ${day.kcal_target}`).toBeLessThan(15);
    }
  );

  it.each(days.map((d) => [d.day_of_week, d] as const))(
    "%s: meets its protein target",
    (_label, day) => {
      const protein = day.meals.reduce((sum, m) => sum + m.alternatives.original.protein_g, 0);
      expect(protein).toBeGreaterThanOrEqual(day.protein_g_target);
    }
  );
});

describe("buildGenericSeedPlan with an unfilled profile", () => {
  // person_b.yml ships with FILL_IN placeholders. The zod schema permits them,
  // so at runtime these are the literal string "FILL_IN" while typed as number
  // — multiplying that produced NaN kcal on every meal card of every day.
  const unfilled = {
    nutrition_targets: {
      total_kcal_target_off_day: "FILL_IN" as unknown as number,
      protein_g_per_day: "FILL_IN" as unknown as number,
    },
  } as PersonProfile;

  it("falls back to real numbers instead of NaN", () => {
    const days = buildGenericSeedPlan(WEEK_START, unfilled);
    expect(days).toHaveLength(7);
    for (const day of days) {
      expect(Number.isFinite(day.kcal_target)).toBe(true);
      expect(Number.isFinite(day.protein_g_target)).toBe(true);
      expect(day.kcal_target).toBeGreaterThan(0);
      for (const meal of day.meals) {
        expect(Number.isFinite(meal.alternatives.original.kcal)).toBe(true);
        expect(Number.isNaN(meal.alternatives.original.protein_g)).toBe(false);
      }
    }
  });

  it("still honours real targets when the profile is filled in", () => {
    const filled = {
      nutrition_targets: { total_kcal_target_off_day: 2400, protein_g_per_day: 120 },
    } as PersonProfile;
    const days = buildGenericSeedPlan(WEEK_START, filled);
    expect(days[0].kcal_target).toBe(2400);
    expect(days[0].protein_g_target).toBe(120);
  });

  it("splits the day into shares that add back up to the target", () => {
    const filled = {
      nutrition_targets: { total_kcal_target_off_day: 2400, protein_g_per_day: 120 },
    } as PersonProfile;
    const day = buildGenericSeedPlan(WEEK_START, filled)[0];
    const total = day.meals.reduce((s, m) => s + m.alternatives.original.kcal, 0);
    expect(Math.abs(total - 2400)).toBeLessThanOrEqual(10); // rounding slack only
  });
});
