import { ensureMigrated } from "./db";
import {
  getMealLogsForPast,
  getSleepLogsForPast,
  getSubstanceLogsForPast,
  getFatigueDatesForPast,
} from "./query";
import { getDayKcalTarget } from "./seed-plan";
import { MEAL_SLOTS } from "./types";
import type { CardState, MealSlot, PersonId } from "./types";

const ALL_SLOTS = MEAL_SLOTS;

export interface HabitTargets {
  kcal: number;
  protein: number;
}

export interface HabitRollup {
  window_days: 7 | 14 | 30;
  end_date: string;
  days_with_data: number;
  avg_kcal_per_day: number;
  avg_protein_per_day: number;
  avg_kcal_per_dow: number[]; // length 7, Sun..Sat, 0 = no data
  days_with_logs_per_dow: number[]; // length 7
  most_missed_slots: { slot: MealSlot; missed_pct: number }[];
  state_distribution: Record<CardState, number>; // percentages summing ~100
  easy_streak_max: number;
  fatigue_days: number;
  substance_days: number;
  sleep_kcal_correlation: "negative" | "positive" | "none"; // short sleep ↔ high kcal?
  insights: HabitInsight[];
}

export interface HabitInsight {
  severity: "info" | "warning" | "alert";
  key:
    | "chronic_under_kcal"
    | "chronic_under_protein"
    | "weekday_dip"
    | "slot_chronically_missed"
    | "easy_dominance"
    | "substance_correlation"
    | "fatigue_frequent"
    | "sleep_kcal_link"
    | "consider_professional_support"
    | "on_track";
  payload?: Record<string, string | number>;
}

function lastNDates(endIso: string, n: number): string[] {
  const out: string[] = [];
  const base = new Date(endIso + "T00:00:00");
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function dowFor(iso: string): number {
  return new Date(iso + "T00:00:00").getDay();
}

export async function getHabitRollup(
  personId: PersonId,
  endIso: string,
  windowDays: 7 | 14 | 30,
  targets: HabitTargets
): Promise<HabitRollup> {
  await ensureMigrated();

  const [meals, sleeps, subs, fatigueDates] = await Promise.all([
    getMealLogsForPast(personId, endIso, windowDays),
    getSleepLogsForPast(personId, endIso, windowDays),
    getSubstanceLogsForPast(personId, endIso, windowDays),
    getFatigueDatesForPast(personId, endIso, windowDays),
  ]);

  const dates = lastNDates(endIso, windowDays);

  // Per-day rollup
  const perDay = dates.map((d) => {
    const dayMeals = meals.filter((m) => m.date === d);
    const totalKcal = dayMeals.reduce((acc, m) => acc + (m.kcal ?? 0), 0);
    const totalProtein = dayMeals.reduce((acc, m) => acc + (m.protein_g ?? 0), 0);
    return {
      date: d,
      dayMeals,
      total_kcal: totalKcal,
      total_protein_g: totalProtein,
      states: dayMeals.map((m) => m.selected_state as CardState),
      missed_slots: ALL_SLOTS.filter((s) => !dayMeals.find((m) => m.slot === s)),
      sleep_hours: sleeps.find((s) => s.date === d)?.hours ?? null,
      had_substance: subs.some((s) => s.date === d),
      had_fatigue: fatigueDates.includes(d),
    };
  });

  const daysWithData = perDay.filter((d) => d.dayMeals.length > 0).length;

  if (daysWithData < 2) {
    return {
      window_days: windowDays,
      end_date: endIso,
      days_with_data: daysWithData,
      avg_kcal_per_day: 0,
      avg_protein_per_day: 0,
      avg_kcal_per_dow: Array(7).fill(0),
      days_with_logs_per_dow: Array(7).fill(0),
      most_missed_slots: [],
      state_distribution: { original: 0, easy: 0, liquid: 0, no_hunger: 0 },
      easy_streak_max: 0,
      fatigue_days: 0,
      substance_days: 0,
      sleep_kcal_correlation: "none",
      insights: [],
    };
  }

  const avgKcal = Math.round(
    perDay.filter((d) => d.dayMeals.length > 0).reduce((acc, d) => acc + d.total_kcal, 0) /
      daysWithData
  );
  const avgProtein = Math.round(
    perDay.filter((d) => d.dayMeals.length > 0).reduce((acc, d) => acc + d.total_protein_g, 0) /
      daysWithData
  );

  // Per day-of-week (Sun=0..Sat=6)
  const dowKcalSum = Array(7).fill(0);
  const dowDays = Array(7).fill(0);
  for (const d of perDay) {
    if (d.dayMeals.length === 0) continue;
    const dow = dowFor(d.date);
    dowKcalSum[dow] += d.total_kcal;
    dowDays[dow] += 1;
  }
  const avgKcalPerDow = dowKcalSum.map((sum, i) => (dowDays[i] > 0 ? Math.round(sum / dowDays[i]) : 0));

  // Most-missed slots — only count days that had ANY logging activity that day
  const activeDays = perDay.filter((d) => d.dayMeals.length > 0).length;
  const missedCounts: Record<string, number> = {};
  for (const slot of ALL_SLOTS) missedCounts[slot] = 0;
  for (const d of perDay) {
    if (d.dayMeals.length === 0) continue;
    for (const s of d.missed_slots) missedCounts[s] += 1;
  }
  const mostMissed = ALL_SLOTS.map((slot) => ({
    slot,
    missed_pct: activeDays > 0 ? Math.round((missedCounts[slot] / activeDays) * 100) : 0,
  }))
    .sort((a, b) => b.missed_pct - a.missed_pct)
    .filter((x) => x.missed_pct > 0)
    .slice(0, 4);

  // State distribution
  const stateCounts: Record<CardState, number> = { original: 0, easy: 0, liquid: 0, no_hunger: 0 };
  let totalStates = 0;
  for (const d of perDay) {
    for (const s of d.states) {
      stateCounts[s] = (stateCounts[s] ?? 0) + 1;
      totalStates += 1;
    }
  }
  const stateDistribution: Record<CardState, number> = {
    original: 0,
    easy: 0,
    liquid: 0,
    no_hunger: 0,
  };
  if (totalStates > 0) {
    for (const k of Object.keys(stateCounts) as CardState[]) {
      stateDistribution[k] = Math.round((stateCounts[k] / totalStates) * 100);
    }
  }

  // Easy streak max
  let easyStreakMax = 0;
  let current = 0;
  for (const d of perDay) {
    const allEasy =
      d.dayMeals.length > 0 &&
      d.states.every((s) => s === "easy" || s === "liquid" || s === "no_hunger");
    if (allEasy) {
      current += 1;
      easyStreakMax = Math.max(easyStreakMax, current);
    } else {
      current = 0;
    }
  }

  const fatigueDays = perDay.filter((d) => d.had_fatigue).length;
  const substanceDays = perDay.filter((d) => d.had_substance).length;

  // Sleep-vs-kcal correlation (short-sleep day kcal vs long-sleep day kcal)
  const shortSleepKcal = perDay
    .filter((d) => d.sleep_hours !== null && d.sleep_hours < 6 && d.dayMeals.length > 0)
    .map((d) => d.total_kcal);
  const longSleepKcal = perDay
    .filter((d) => d.sleep_hours !== null && d.sleep_hours >= 7 && d.dayMeals.length > 0)
    .map((d) => d.total_kcal);
  let sleepKcalCorrelation: "negative" | "positive" | "none" = "none";
  if (shortSleepKcal.length >= 2 && longSleepKcal.length >= 2) {
    const avgShort = shortSleepKcal.reduce((a, b) => a + b, 0) / shortSleepKcal.length;
    const avgLong = longSleepKcal.reduce((a, b) => a + b, 0) / longSleepKcal.length;
    if (avgShort > avgLong * 1.1) sleepKcalCorrelation = "positive"; // short sleep → high kcal
    else if (avgShort < avgLong * 0.9) sleepKcalCorrelation = "negative";
  }

  // Build insights
  const insights: HabitInsight[] = [];
  // Guard against an unfilled profile (targets not yet set to real numbers) —
  // without this, dividing by a zero/invalid target turns every insight
  // into a literal "NaN%" instead of just producing no insight.
  const hasValidTargets = targets.kcal > 0 && targets.protein > 0;
  // A flat off-day target here would misread a window that includes skate
  // days (which budget for meaningfully more kcal) as "chronically under
  // target" — pull each logged day's own planned target instead, same fix
  // as the home-page predictions. Protein target doesn't vary by day type
  // in this app, so `targets.protein` alone is still correct.
  const daysWithMeals = perDay.filter((d) => d.dayMeals.length > 0);
  const perDayTargets = hasValidTargets
    ? await Promise.all(daysWithMeals.map((d) => getDayKcalTarget(personId, d.date, targets.kcal)))
    : [];
  const avgTargetKcal = perDayTargets.length > 0
    ? perDayTargets.reduce((a, b) => a + b, 0) / perDayTargets.length
    : targets.kcal;
  const kcalUnderPct = hasValidTargets ? Math.round(((avgTargetKcal - avgKcal) / avgTargetKcal) * 100) : 0;
  const proteinUnderPct = hasValidTargets ? Math.round(((targets.protein - avgProtein) / targets.protein) * 100) : 0;

  if (kcalUnderPct >= 15 && daysWithData >= 3) {
    insights.push({
      severity: "warning",
      key: "chronic_under_kcal",
      payload: { pct: kcalUnderPct },
    });
  }
  if (proteinUnderPct >= 15 && daysWithData >= 3) {
    insights.push({
      severity: "warning",
      key: "chronic_under_protein",
      payload: { pct: proteinUnderPct },
    });
  }

  // Weekday dip
  const dowsWithData = avgKcalPerDow
    .map((kcal, i) => ({ kcal, i }))
    .filter((x) => x.kcal > 0);
  if (dowsWithData.length >= 3) {
    const lowest = dowsWithData.reduce((min, x) => (x.kcal < min.kcal ? x : min));
    const avg = dowsWithData.reduce((a, x) => a + x.kcal, 0) / dowsWithData.length;
    if (lowest.kcal < avg * 0.75) {
      insights.push({
        severity: "info",
        key: "weekday_dip",
        payload: { dow_index: lowest.i },
      });
    }
  }

  // Chronically-missed slot
  if (mostMissed[0] && mostMissed[0].missed_pct >= 40) {
    insights.push({
      severity: "info",
      key: "slot_chronically_missed",
      payload: { slot: mostMissed[0].slot, pct: mostMissed[0].missed_pct },
    });
  }

  // Easy dominance
  const easyShare = stateDistribution.easy + stateDistribution.liquid + stateDistribution.no_hunger;
  if (easyShare >= 70 && totalStates >= 10) {
    insights.push({
      severity: "warning",
      key: "easy_dominance",
      payload: { pct: easyShare },
    });
  }

  if (substanceDays > 0) {
    const subDayKcal = perDay
      .filter((d) => d.had_substance && d.dayMeals.length > 0)
      .map((d) => d.total_kcal);
    if (subDayKcal.length >= 2) {
      const avgSub = subDayKcal.reduce((a, b) => a + b, 0) / subDayKcal.length;
      if (avgSub < avgKcal * 0.85) {
        insights.push({ severity: "info", key: "substance_correlation" });
      }
    }
  }

  if (fatigueDays >= 3) {
    insights.push({
      severity: "info",
      key: "fatigue_frequent",
      payload: { days: fatigueDays },
    });
  }

  if (sleepKcalCorrelation === "positive") {
    insights.push({ severity: "info", key: "sleep_kcal_link" });
  }

  // Everything above resolves to "log more" / "adjust the plan" — none of
  // it ever points toward a human. Only on the longer windows (a single
  // rough week shouldn't trigger this) and only when multiple severe
  // signals compound at once — a sustained, combined pattern is a
  // different thing than any one flag alone, and worth surfacing as such
  // rather than just another self-serve tip.
  if (windowDays >= 14) {
    const compoundingDeficit = kcalUnderPct >= 15 && proteinUnderPct >= 15 && daysWithData >= 5;
    const compoundingOverwhelm = easyShare >= 70 && fatigueDays >= 3 && totalStates >= 10;
    const escalatingSubstanceUse = substanceDays >= windowDays * 0.4;
    if (compoundingDeficit || compoundingOverwhelm || escalatingSubstanceUse) {
      insights.push({ severity: "alert", key: "consider_professional_support" });
    }
  }

  if (insights.length === 0 && daysWithData >= 5) {
    insights.push({ severity: "info", key: "on_track" });
  }

  return {
    window_days: windowDays,
    end_date: endIso,
    days_with_data: daysWithData,
    avg_kcal_per_day: avgKcal,
    avg_protein_per_day: avgProtein,
    avg_kcal_per_dow: avgKcalPerDow,
    days_with_logs_per_dow: dowDays,
    most_missed_slots: mostMissed,
    state_distribution: stateDistribution,
    easy_streak_max: easyStreakMax,
    fatigue_days: fatigueDays,
    substance_days: substanceDays,
    sleep_kcal_correlation: sleepKcalCorrelation,
    insights,
  };
}

