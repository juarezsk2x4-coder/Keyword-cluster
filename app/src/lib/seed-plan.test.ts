import { describe, it, expect } from "vitest";
import { buildWeeklyPlan, buildGenericSeedPlan, isUsableWeek } from "./seed-plan";
import { MEAL_SLOTS } from "./types";
import type { DailyPlan, PersonProfile } from "./types";
import { addDaysIso, dowForIso } from "./dates";

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

// isUsableWeek gates whether a stored (often AI-generated) plan gets trusted
// or silently discarded in favor of the generic seed plan. The AI's JSON
// schema only requires `date` to be a string and never sorts what it stores,
// so a legitimate plan can have its 7 days in any order — this must accept
// that, while still rejecting genuinely broken shapes (a NaN target used to
// render a NaN ring on the home page before this validator existed at all).
describe("isUsableWeek", () => {
  const validWeek = () => buildWeeklyPlan(WEEK_START) as unknown as DailyPlan[];

  it("accepts a correctly-shaped week in the expected order", () => {
    expect(isUsableWeek(validWeek(), WEEK_START)).toBe(true);
  });

  it("accepts the same week with its days shuffled out of order", () => {
    const shuffled = [...validWeek()];
    [shuffled[0], shuffled[6]] = [shuffled[6], shuffled[0]];
    [shuffled[2], shuffled[4]] = [shuffled[4], shuffled[2]];
    expect(isUsableWeek(shuffled, WEEK_START)).toBe(true);
  });

  it("rejects a week with fewer than 7 days", () => {
    expect(isUsableWeek(validWeek().slice(0, 6), WEEK_START)).toBe(false);
  });

  it("rejects a week missing one of the 7 expected dates (a duplicate instead)", () => {
    const broken = validWeek();
    broken[6] = { ...broken[6], date: broken[0].date }; // duplicate day 0, day 6 missing
    expect(isUsableWeek(broken, WEEK_START)).toBe(false);
  });

  it("rejects a week anchored to the wrong start date", () => {
    expect(isUsableWeek(validWeek(), addDaysIso(WEEK_START, 7))).toBe(false);
  });

  it("rejects a day with a non-finite kcal_target (the original NaN-ring bug)", () => {
    const broken = validWeek();
    broken[0] = { ...broken[0], kcal_target: NaN };
    expect(isUsableWeek(broken, WEEK_START)).toBe(false);
    const broken2 = validWeek();
    // @ts-expect-error deliberately wrong shape, simulating a malformed AI response
    broken2[0] = { ...broken2[0], kcal_target: "FILL_IN" };
    expect(isUsableWeek(broken2, WEEK_START)).toBe(false);
  });

  it("rejects a day with no meals", () => {
    const broken = validWeek();
    broken[0] = { ...broken[0], meals: [] };
    expect(isUsableWeek(broken, WEEK_START)).toBe(false);
  });

  it("rejects non-array and null input without throwing", () => {
    expect(isUsableWeek(null, WEEK_START)).toBe(false);
    expect(isUsableWeek(undefined, WEEK_START)).toBe(false);
    expect(isUsableWeek("not a plan", WEEK_START)).toBe(false);
    expect(isUsableWeek({}, WEEK_START)).toBe(false);
  });
});
