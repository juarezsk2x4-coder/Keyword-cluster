import { describe, it, expect, beforeEach } from "vitest";
import { getPredictions } from "./predictions";
import type { PredictionInsight } from "./predictions";
import { resetDb, seedFullDay, seedSubstance, seedSleep } from "./test-db";

const TARGETS = { kcalNormal: 2500, kcalSkate: 3300, protein: 130 };

// Monday 2026-09-07. Its two prior days are Sun 09-06 and Sat 09-05, which are
// both skate days in the hand-authored plan (3300 kcal target).
const MONDAY = "2026-09-07";
const SUN = "2026-09-06";
const SAT = "2026-09-05";

// A plain Thursday, whose two prior days are ordinary 2500 kcal work days.
const THURSDAY = "2026-09-03";
const WED = "2026-09-02";
const TUE = "2026-09-01";

const keys = (insights: PredictionInsight[]) => insights.map((i) => i.key);

beforeEach(async () => {
  await resetDb();
});

describe("kcal trend compares against each day's own target", () => {
  it("does not read a correctly-fuelled pair of skate days as a surplus", async () => {
    // Ate exactly the 3300 skate target on both prior days.
    await seedFullDay(SAT, 3300, 130);
    await seedFullDay(SUN, 3300, 130);

    const p = await getPredictions("person_a", MONDAY, false, TARGETS);

    expect(p.avg_kcal_last_3).toBe(3300);
    // Against a flat 2500 this was +32% and fired kcal_surplus, telling him to
    // eat lighter the day after two perfectly fuelled skate days.
    expect(p.kcal_deficit_pct).toBe(0);
    expect(keys(p.insights)).not.toContain("kcal_surplus");
  });

  it("still reports a real surplus on ordinary days", async () => {
    await seedFullDay(TUE, 3200, 130);
    await seedFullDay(WED, 3200, 130);

    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);

    expect(p.kcal_deficit_pct).toBe(28); // 3200 vs 2500
    expect(keys(p.insights)).toContain("kcal_surplus");
  });

  it("still reports a real deficit on ordinary days", async () => {
    await seedFullDay(TUE, 1700, 60);
    await seedFullDay(WED, 1700, 60);

    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);

    expect(p.kcal_deficit_pct).toBeLessThanOrEqual(-20);
    expect(keys(p.insights)).toContain("kcal_deficit");
  });
});

describe("adjustments never appear without an insight explaining them", () => {
  it("pairs kcal_boost with kcal_deficit", async () => {
    await seedFullDay(TUE, 1700, 120);
    await seedFullDay(WED, 1700, 120);
    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);
    if (p.kcal_boost > 0) expect(keys(p.insights)).toContain("kcal_deficit");
  });

  it("pairs protein_boost_g with protein_deficit", async () => {
    await seedFullDay(TUE, 2500, 90);
    await seedFullDay(WED, 2500, 90);
    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);
    if (p.protein_boost_g > 0) expect(keys(p.insights)).toContain("protein_deficit");
  });

  it("pairs the hydration bump with post_substance even two days back", async () => {
    // Logged on the day BEFORE yesterday. The hydration bump has always looked
    // back over both days; the insight used to check yesterday only, so this
    // combination produced +1L with nothing on screen explaining it.
    await seedFullDay(TUE, 2500, 130);
    await seedFullDay(WED, 2500, 130);
    await seedSubstance(TUE, "stimulant");

    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);

    expect(p.stimulant_in_last_3d).toBe(true);
    expect(p.hydration_extra_l).toBeGreaterThan(0);
    expect(keys(p.insights)).toContain("post_substance");
  });

  it("scales protein_boost_g to the actual protein target", async () => {
    await seedFullDay(TUE, 2500, 90);
    await seedFullDay(WED, 2500, 90);

    const low = await getPredictions("person_a", THURSDAY, false, TARGETS);
    const high = await getPredictions("person_a", THURSDAY, false, { ...TARGETS, protein: 260 });

    // Same logged protein, double the target => a bigger recommended top-up.
    // A flat percentage-to-grams conversion would return the same number here.
    expect(high.protein_boost_g).toBeGreaterThan(low.protein_boost_g);
  });
});

describe("streak insights are reachable", () => {
  it("fires easy_streak on two consecutive easy days", async () => {
    // The lookback window only ever holds two days, so a >=3 threshold could
    // never fire — the warning was dead code.
    await seedFullDay(TUE, 900, 40, "easy");
    await seedFullDay(WED, 900, 40, "liquid");

    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);

    expect(p.consecutive_easy_or_liquid).toBe(2);
    expect(keys(p.insights)).toContain("easy_streak");
  });
});

describe("degenerate inputs", () => {
  it("produces no NaN and no percentage insights with no data at all", async () => {
    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);
    expect(Number.isNaN(p.kcal_deficit_pct)).toBe(false);
    expect(Number.isNaN(p.protein_deficit_pct)).toBe(false);
    expect(p.kcal_deficit_pct).toBe(0);
    expect(keys(p.insights)).not.toContain("kcal_surplus");
    expect(keys(p.insights)).not.toContain("kcal_deficit");
  });

  it("stays finite when the profile targets are unfilled FILL_IN placeholders", async () => {
    await seedFullDay(TUE, 2000, 100);
    await seedFullDay(WED, 2000, 100);
    const unfilled = {
      kcalNormal: "FILL_IN" as unknown as number,
      kcalSkate: "FILL_IN" as unknown as number,
      protein: "FILL_IN" as unknown as number,
    };
    const p = await getPredictions("person_a", THURSDAY, false, unfilled);
    expect(Number.isNaN(p.kcal_deficit_pct)).toBe(false);
    expect(Number.isNaN(p.protein_deficit_pct)).toBe(false);
    expect(p.protein_boost_g).toBe(0);
    expect(p.kcal_boost).toBe(0);
  });

  it("reads today's sleep, not yesterday's", async () => {
    // lastNDates used to drop the end date entirely east of UTC, so "today's"
    // rollup was actually yesterday and today's sleep never drove an insight.
    await seedFullDay(TUE, 2500, 130);
    await seedFullDay(WED, 2500, 130);
    await seedSleep(THURSDAY, 4);

    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);

    expect(p.sleep_short_today).toBe(true);
    expect(keys(p.insights)).toContain("sleep_short");
  });
});

describe("works with just 1 day of the 2-day lookback logged", () => {
  it("shows on_track from a single logged day, not just an empty banner", async () => {
    // Only WED logged, TUE has nothing — was gated at daysWithData >= 2
    // (effectively both lookback days), even though kcal_deficit_pct is
    // already a plain average that works fine from 1 day.
    await seedFullDay(WED, 2500, 130);

    const p = await getPredictions("person_a", THURSDAY, false, TARGETS);

    expect(p.days_with_data).toBe(1);
    expect(Number.isNaN(p.kcal_deficit_pct)).toBe(false);
    expect(keys(p.insights)).toEqual(["on_track"]);
  });
});
