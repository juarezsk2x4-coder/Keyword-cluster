import { describe, it, expect, beforeEach } from "vitest";
import { getHabitRollup } from "./habits";
import { resetDb, seedFullDay, seedExercise, seedSupplement } from "./test-db";
import { addDaysIso } from "./dates";

const TARGETS = { kcal: 2500, protein: 130 };
const SUPPLEMENTS = ["Sany D 2.000 UI", "Multivitamínico"];
const EXERCISE_OPTS = {
  loggableExercises: ["Skate", "Pilates", "Musculação"],
  exerciseKcalEstimates: { Skate: 7.22, Pilates: 400, Musculação: 350 },
  durationVariableExercises: ["Skate"],
  dailySupplements: SUPPLEMENTS,
};

const END = "2026-09-04";

beforeEach(async () => {
  await resetDb();
});

describe("exercise aggregation", () => {
  it("counts days, streaks and kcal from real logs", async () => {
    await seedFullDay(END, 2500, 130);
    await seedFullDay(addDaysIso(END, -1), 2500, 130);
    // Three consecutive exercise days, then a gap, then one more.
    await seedExercise({ date: END, type: "Pilates" });
    await seedExercise({ date: addDaysIso(END, -1), type: "Skate", minutes: 90 });
    await seedExercise({ date: addDaysIso(END, -2), type: "Musculação" });
    await seedExercise({ date: addDaysIso(END, -5), type: "Pilates" });

    const r = await getHabitRollup("person_a", END, 7, TARGETS, EXERCISE_OPTS);

    expect(r.exercise_days).toBe(4);
    expect(r.exercise_streak_max).toBe(3);
    // 400 + round(7.22*90)=650 + 350 + 400
    expect(r.total_exercise_kcal).toBe(1800);
    expect(r.avg_exercise_kcal_per_active_day).toBe(450);
    expect(Number.isInteger(r.total_exercise_kcal)).toBe(true);
  });

  it("returns one chronological trend entry per window day", async () => {
    await seedFullDay(END, 2500, 130);
    await seedFullDay(addDaysIso(END, -1), 2500, 130);
    await seedExercise({ date: END, type: "Pilates" });

    const r = await getHabitRollup("person_a", END, 30, TARGETS, EXERCISE_OPTS);

    expect(r.exercise_kcal_trend).toHaveLength(30);
    const dates = r.exercise_kcal_trend.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates); // oldest first
    expect(dates[dates.length - 1]).toBe(END);
    expect(r.exercise_kcal_trend.at(-1)?.kcal).toBe(400);
    // The trend must agree with the headline total.
    const summed = r.exercise_kcal_trend.reduce((s, d) => s + d.kcal, 0);
    expect(summed).toBe(r.total_exercise_kcal);
  });

  it("reports nothing for a profile that hasn't opted in", async () => {
    await seedFullDay(END, 2500, 130);
    await seedFullDay(addDaysIso(END, -1), 2500, 130);
    await seedExercise({ date: END, type: "Pilates" });

    const r = await getHabitRollup("person_b", END, 7, TARGETS); // no exercise opts

    expect(r.exercise_days).toBe(0);
    expect(r.total_exercise_kcal).toBe(0);
    expect(r.supplement_adherence_pct).toBe(0);
    expect(r.insights.map((i) => i.key)).not.toContain("exercise_infrequent");
  });
});

describe("supplement adherence", () => {
  it("is the share of window days where every supplement was taken", async () => {
    await seedFullDay(END, 2500, 130);
    await seedFullDay(addDaysIso(END, -1), 2500, 130);
    // Both supplements on 2 of 7 days; only one of them on a third day.
    for (const d of [END, addDaysIso(END, -1)]) {
      for (const s of SUPPLEMENTS) await seedSupplement(d, s);
    }
    await seedSupplement(addDaysIso(END, -2), SUPPLEMENTS[0]);

    const r = await getHabitRollup("person_a", END, 7, TARGETS, EXERCISE_OPTS);

    expect(r.supplement_adherence_pct).toBe(29); // 2/7
    expect(r.insights.map((i) => i.key)).toContain("supplement_adherence_low");
  });

  it("stays within 0-100 even when every day is complete", async () => {
    await seedFullDay(END, 2500, 130);
    await seedFullDay(addDaysIso(END, -1), 2500, 130);
    for (let i = 0; i < 7; i++) {
      for (const s of SUPPLEMENTS) await seedSupplement(addDaysIso(END, -i), s);
    }

    const r = await getHabitRollup("person_a", END, 7, TARGETS, EXERCISE_OPTS);

    expect(r.supplement_adherence_pct).toBe(100);
    expect(r.insights.map((i) => i.key)).not.toContain("supplement_adherence_low");
  });
});

describe("the rollup does not hide exercise behind missing meal logs", () => {
  it("still reports exercise when meals were barely logged", async () => {
    // One meal day only — below the 2-day meal threshold that used to bail out
    // with an all-zero rollup and an "not enough data" screen, discarding a
    // fully logged fortnight of exercise and supplements.
    await seedFullDay(END, 2500, 130);
    for (let i = 0; i < 6; i++) {
      await seedExercise({ date: addDaysIso(END, -i), type: "Pilates" });
      for (const s of SUPPLEMENTS) await seedSupplement(addDaysIso(END, -i), s);
    }

    const r = await getHabitRollup("person_a", END, 7, TARGETS, EXERCISE_OPTS);

    expect(r.has_any_data).toBe(true);
    expect(r.exercise_days).toBe(6);
    expect(r.supplement_adherence_pct).toBe(86); // 6/7
    // Meal-derived numbers stay honest rather than turning into NaN.
    expect(Number.isNaN(r.avg_kcal_per_day)).toBe(false);
  });

  it("still bails out when there is genuinely nothing logged", async () => {
    const r = await getHabitRollup("person_a", END, 7, TARGETS, EXERCISE_OPTS);
    expect(r.has_any_data).toBe(false);
    expect(r.days_with_data).toBe(0);
    expect(r.insights).toEqual([]);
  });
});

describe("chronic-deficit insight accounts for skate days", () => {
  it("does not call a correctly-fuelled skate week 'chronically under target'", async () => {
    // Window ending Sunday 2026-09-06 contains Sat+Sun skate days (3300) and
    // five 2500 work days. Eat each day's own target exactly.
    const end = "2026-09-06";
    for (let i = 0; i < 7; i++) {
      const d = addDaysIso(end, -i);
      const isSkate = d === "2026-09-06" || d === "2026-09-05";
      await seedFullDay(d, isSkate ? 3300 : 2500, 130);
    }

    const r = await getHabitRollup("person_a", end, 7, TARGETS, EXERCISE_OPTS);

    // Against a flat 2500 the skate days drag the average up and this reads as
    // a surplus; against each day's own target it should be roughly on target.
    expect(r.insights.map((i) => i.key)).not.toContain("chronic_under_kcal");
  });

  it("still flags a genuinely under-fuelled week", async () => {
    const end = "2026-09-06";
    for (let i = 0; i < 7; i++) {
      await seedFullDay(addDaysIso(end, -i), 1500, 60);
    }

    const r = await getHabitRollup("person_a", end, 7, TARGETS, EXERCISE_OPTS);

    expect(r.insights.map((i) => i.key)).toContain("chronic_under_kcal");
    expect(r.insights.map((i) => i.key)).toContain("chronic_under_protein");
  });
});
