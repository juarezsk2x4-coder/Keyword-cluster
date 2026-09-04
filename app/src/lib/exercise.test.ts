import { describe, it, expect } from "vitest";
import { estimateExerciseKcal, sumExerciseKcal } from "./exercise";
import type { ExerciseLog } from "./types";

const log = (over: Partial<ExerciseLog> = {}): ExerciseLog => ({
  date: "2026-09-04",
  exercise_type: "Pilates",
  logged_at: "2026-09-04 10:00:00",
  ...over,
});

const ESTIMATES = { Skate: 7.22, Pilates: 400, Musculação: 350 };
const DURATION_VARIABLE = ["Skate"];

describe("estimateExerciseKcal", () => {
  it("uses a flat per-session figure for fixed-length exercises", () => {
    expect(estimateExerciseKcal(log({ exercise_type: "Pilates" }), ESTIMATES, DURATION_VARIABLE)).toBe(400);
    expect(estimateExerciseKcal(log({ exercise_type: "Musculação" }), ESTIMATES, DURATION_VARIABLE)).toBe(350);
  });

  it("ignores duration for a fixed-length exercise", () => {
    const withDuration = log({ exercise_type: "Pilates", duration_minutes: 90 });
    expect(estimateExerciseKcal(withDuration, ESTIMATES, DURATION_VARIABLE)).toBe(400);
  });

  it("scales a duration-variable exercise by its logged minutes", () => {
    const skate = log({ exercise_type: "Skate", duration_minutes: 90 });
    // 7.22 * 90 = 649.8 — must round, not leak a decimal into a kcal display.
    expect(estimateExerciseKcal(skate, ESTIMATES, DURATION_VARIABLE)).toBe(650);
    expect(Number.isInteger(estimateExerciseKcal(skate, ESTIMATES, DURATION_VARIABLE))).toBe(true);
  });

  it("returns 0 for a duration-variable exercise logged without a duration", () => {
    const skate = log({ exercise_type: "Skate" });
    expect(estimateExerciseKcal(skate, ESTIMATES, DURATION_VARIABLE)).toBe(0);
  });

  it("returns 0 for an exercise with no estimate configured", () => {
    const other = log({ exercise_type: "other", custom_label: "capoeira" });
    expect(estimateExerciseKcal(other, ESTIMATES, DURATION_VARIABLE)).toBe(0);
  });

  it("returns 0 when the profile has no estimates at all (opt-in feature, e.g. Person B)", () => {
    expect(estimateExerciseKcal(log(), undefined, [])).toBe(0);
  });
});

describe("sumExerciseKcal", () => {
  it("sums a mixed day and stays integral", () => {
    const logs = [
      log({ exercise_type: "Skate", duration_minutes: 90 }), // 650
      log({ exercise_type: "Pilates" }), // 400
      log({ exercise_type: "other", custom_label: "surfe" }), // 0
    ];
    const total = sumExerciseKcal(logs, ESTIMATES, DURATION_VARIABLE);
    expect(total).toBe(1050);
    expect(Number.isInteger(total)).toBe(true);
  });

  it("is 0 for an empty day", () => {
    expect(sumExerciseKcal([], ESTIMATES, DURATION_VARIABLE)).toBe(0);
  });

  it("sums per-log rounded values so displayed rows add up to the displayed total", () => {
    // Three 25-minute skate sessions: 7.22*25 = 180.5 -> 181 each.
    // Rounding per log (181*3 = 543) is what History shows row by row, so the
    // total must agree with that rather than with round(180.5*3) = 542.
    const logs = [25, 25, 25].map((m, i) =>
      log({ exercise_type: "Skate", duration_minutes: m, custom_label: String(i) })
    );
    expect(sumExerciseKcal(logs, ESTIMATES, DURATION_VARIABLE)).toBe(543);
  });
});
