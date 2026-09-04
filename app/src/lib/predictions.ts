import { getDb, ensureMigrated } from "./db";
import { MEAL_SLOTS } from "./types";
import type { MealLog, SleepLog, SubstanceLog, PersonId } from "./types";
import { getDayKcalTarget } from "./seed-plan";
import { lastNDates } from "./dates";

export interface DayRollup {
  date: string;
  meals_logged: number;
  total_kcal: number;
  total_protein_g: number;
  states_picked: string[];
  missed_slots: string[];           // slots without a log
  sleep_hours: number | null;
  substances: string[];
  was_fatigued: boolean;
}

export interface Prediction {
  days_with_data: number;
  avg_kcal_last_3: number;
  avg_protein_last_3: number;
  kcal_target: number;
  protein_target: number;

  // detected patterns
  kcal_deficit_pct: number;          // negative = under, positive = over (avg vs each day's own target)
  protein_deficit_pct: number;
  consecutive_easy_or_liquid: number;
  missed_meals_yesterday: string[];
  stimulant_in_last_3d: boolean;
  alcohol_in_last_3d: boolean;
  sleep_short_today: boolean;
  sleep_long_today: boolean;
  fatigue_streak: number;

  // recommended adjustments for today
  protein_boost_g: number;
  kcal_boost: number;
  hydration_extra_l: number;

  // surfaced messages (i18n keys to look up, with values)
  insights: PredictionInsight[];
}

export interface PredictionInsight {
  severity: "info" | "warning" | "alert";
  key:
    | "protein_deficit"
    | "kcal_deficit"
    | "kcal_surplus"
    | "missed_meals"
    | "easy_streak"
    | "fatigue_streak"
    | "post_substance"
    | "post_alcohol"
    | "skate_syncope_risk"
    | "sleep_short"
    | "sleep_long"
    | "on_track";
  payload?: Record<string, string | number>;
}

export interface PredictionTargets {
  kcalNormal: number;
  kcalSkate: number;
  protein: number;
}

export async function getPredictions(
  personId: PersonId,
  todayIso: string,
  isSkateDayToday: boolean,
  targets: PredictionTargets
): Promise<Prediction> {
  await ensureMigrated();

  const dates = lastNDates(todayIso, 3);
  const yesterdayIso = dates[1];
  const PROTEIN_TARGET = targets.protein;
  const KCAL_TARGET_NORMAL = targets.kcalNormal;
  const KCAL_TARGET_SKATE = targets.kcalSkate;

  const db = getDb();
  const [mealsResp, sleepResp, subsResp, fatigueResp] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM meal_logs WHERE person_id = ? AND date IN (?, ?, ?) ORDER BY date DESC, slot ASC`,
      args: [personId, ...dates] as [string, string, string, string],
    }),
    db.execute({
      sql: `SELECT * FROM sleep_logs WHERE person_id = ? AND date IN (?, ?, ?)`,
      args: [personId, ...dates] as [string, string, string, string],
    }),
    db.execute({
      sql: `SELECT * FROM substance_logs WHERE person_id = ? AND date IN (?, ?, ?)`,
      args: [personId, ...dates] as [string, string, string, string],
    }),
    db.execute({
      sql: `SELECT * FROM fatigue_logs WHERE person_id = ? AND date IN (?, ?, ?)`,
      args: [personId, ...dates] as [string, string, string, string],
    }),
  ]);

  const meals = mealsResp.rows as unknown as MealLog[];
  const sleeps = sleepResp.rows as unknown as SleepLog[];
  const subs = subsResp.rows as unknown as SubstanceLog[];
  const fatigues = fatigueResp.rows as unknown as { date: string }[];

  const ALL_SLOTS = MEAL_SLOTS;

  const rollups: DayRollup[] = dates.map((d) => {
    const dayMeals = meals.filter((m) => m.date === d);
    const daySleeps = sleeps.filter((s) => s.date === d);
    const daySubs = subs.filter((s) => s.date === d);
    const wasFatigued = fatigues.some((f) => f.date === d);

    return {
      date: d,
      meals_logged: dayMeals.length,
      total_kcal: dayMeals.reduce((acc, m) => acc + (m.kcal ?? 0), 0),
      total_protein_g: dayMeals.reduce((acc, m) => acc + (m.protein_g ?? 0), 0),
      states_picked: dayMeals.map((m) => m.selected_state),
      missed_slots: ALL_SLOTS.filter((s) => !dayMeals.find((m) => m.slot === s)),
      sleep_hours: daySleeps[0]?.hours ?? null,
      substances: daySubs.map((s) => s.substance),
      was_fatigued: wasFatigued,
    };
  });

  // Last 3 days = today, yesterday, day-before
  // For "averages of recent intake" we care about yesterday + day before (today still in progress)
  const past = rollups.slice(1); // skip today
  const daysWithData = past.filter((r) => r.meals_logged > 0).length;
  const avg_kcal = daysWithData > 0 ? past.reduce((a, r) => a + r.total_kcal, 0) / daysWithData : 0;
  const avg_protein = daysWithData > 0 ? past.reduce((a, r) => a + r.total_protein_g, 0) / daysWithData : 0;

  const kcalTargetToday = isSkateDayToday ? KCAL_TARGET_SKATE : KCAL_TARGET_NORMAL;
  const proteinTarget = PROTEIN_TARGET;
  // Guard against an unfilled profile (targets not yet set to real numbers).
  const hasValidTargets = KCAL_TARGET_NORMAL > 0 && proteinTarget > 0;

  // Each past day budgeted a different kcal_target depending on whether it
  // was a skate day (a schedule/weather thing, not a fixed weekday) — a
  // flat off-day number here would read a correctly-fueled skate day as
  // "overeating". Pull each day's OWN planned target instead (same source
  // dayPlan.kcal_target on the home page uses for that date). Only days
  // that actually have logged data count, same as avg_kcal above — an
  // unfilled day's target shouldn't dilute the comparison. Protein target
  // doesn't vary by day type in this app, so no equivalent is needed there.
  const pastKcalTargets = hasValidTargets
    ? await Promise.all(past.map((r) => getDayKcalTarget(personId, r.date, KCAL_TARGET_NORMAL)))
    : [];
  const avgTargetKcal = daysWithData > 0
    ? past.reduce((sum, r, i) => sum + (r.meals_logged > 0 ? pastKcalTargets[i] : 0), 0) / daysWithData
    : KCAL_TARGET_NORMAL;

  const kcal_deficit_pct = daysWithData > 0 && hasValidTargets
    ? Math.round(((avg_kcal - avgTargetKcal) / avgTargetKcal) * 100)
    : 0;
  const protein_deficit_pct = daysWithData > 0 && hasValidTargets
    ? Math.round(((avg_protein - proteinTarget) / proteinTarget) * 100)
    : 0;

  // Streak analysis. The lookback window is only 2 days (yesterday +
  // day-before), so a ">=3 days" threshold here could never fire — dead
  // code masquerading as a live warning. Thresholds below are capped to
  // what a 2-day window can actually produce.
  const consecutive_easy_or_liquid = countConsecutive(past, (r) =>
    r.states_picked.length > 0 &&
    r.states_picked.every((s) => s === "easy" || s === "liquid" || s === "no_hunger")
  );
  const fatigue_streak = countConsecutive(past, (r) => r.was_fatigued);

  // Substance / sleep flags
  const yesterday = rollups[1];
  const stimulant_in_last_3d = past.some((r) => r.substances.includes("stimulant"));
  const alcohol_in_last_3d = past.some((r) => r.substances.includes("alcohol"));
  const today = rollups[0];
  const sleep_short_today = today.sleep_hours !== null && today.sleep_hours < 5;
  const sleep_long_today = today.sleep_hours !== null && today.sleep_hours >= 9;

  // Don't count AM slots as "missed" for alerting when yesterday was a
  // documented long-sleep (hypersonia) morning — sleeping through
  // cafe_da_manha/lanche_manha on a 9h+ night is an explained, expected
  // pattern (see the sleep overlay elsewhere in this file), not neglect
  // that should surface as a warning. The slots still count as "not eaten"
  // for kcal/macro purposes; this only changes whether they trigger the
  // missed_meals insight.
  const yesterdaySleptLong = yesterday.sleep_hours !== null && yesterday.sleep_hours >= 9;
  const AM_SLOTS = ["cafe_da_manha", "lanche_manha"];
  const missed_meals_yesterday = yesterdaySleptLong
    ? yesterday.missed_slots.filter((s) => !AM_SLOTS.includes(s))
    : yesterday.missed_slots;

  // Compute today's adjustments
  let protein_boost_g = 0;
  let kcal_boost = 0;
  let hydration_extra_l = 0;

  // Trigger thresholds match the protein_deficit/kcal_deficit insights
  // below exactly, so a "+Xg protein" / "+X kcal" adjustment never shows
  // up in the UI without the insight text that explains why.
  if (protein_deficit_pct <= -15) {
    protein_boost_g = Math.round(proteinTarget * Math.abs(protein_deficit_pct) / 100 / 2);
  }
  if (kcal_deficit_pct <= -20) {
    kcal_boost = Math.round(kcalTargetToday * Math.abs(kcal_deficit_pct) / 100 / 2);
  }
  if (stimulant_in_last_3d || alcohol_in_last_3d) {
    hydration_extra_l += 1;
  }
  if (sleep_short_today) {
    hydration_extra_l += 0.5;
  }
  // Recent stimulant use going into a hard skate day is exactly the
  // collision the profile's own notes flag as highest syncope risk
  // (depleted Mg/electrolytes + prior dehydration + accumulated cardiac
  // load). Extra hydration on top of the general post-substance bump.
  const skate_syncope_risk = isSkateDayToday && stimulant_in_last_3d;
  if (skate_syncope_risk) {
    hydration_extra_l += 1;
  }

  // Build insights
  const insights: PredictionInsight[] = [];

  if (protein_deficit_pct <= -15) {
    insights.push({
      severity: "warning",
      key: "protein_deficit",
      payload: { pct: Math.abs(protein_deficit_pct), boost: protein_boost_g },
    });
  }
  if (kcal_deficit_pct <= -20) {
    insights.push({
      severity: "warning",
      key: "kcal_deficit",
      payload: { pct: Math.abs(kcal_deficit_pct), boost: kcal_boost },
    });
  }
  if (kcal_deficit_pct >= 15) {
    insights.push({
      severity: "info",
      key: "kcal_surplus",
      payload: { pct: kcal_deficit_pct },
    });
  }
  if (missed_meals_yesterday.length >= 2) {
    insights.push({
      severity: "warning",
      key: "missed_meals",
      payload: { count: missed_meals_yesterday.length },
    });
  }
  if (consecutive_easy_or_liquid >= 2) {
    insights.push({
      severity: "warning",
      key: "easy_streak",
      payload: { days: consecutive_easy_or_liquid },
    });
  }
  if (fatigue_streak >= 2) {
    insights.push({
      severity: "info",
      key: "fatigue_streak",
      payload: { days: fatigue_streak },
    });
  }
  // Matches stimulant_in_last_3d/alcohol_in_last_3d exactly (both look back
  // over the same 2-day window) — previously these only checked yesterday,
  // so a substance logged the day before yesterday could add hydration_extra_l
  // with no insight text explaining why.
  if (stimulant_in_last_3d) {
    insights.push({ severity: "alert", key: "post_substance" });
  }
  if (alcohol_in_last_3d) {
    insights.push({ severity: "info", key: "post_alcohol" });
  }
  if (skate_syncope_risk) {
    insights.push({ severity: "alert", key: "skate_syncope_risk" });
  }
  if (sleep_short_today) {
    insights.push({
      severity: "warning",
      key: "sleep_short",
      payload: { hours: today.sleep_hours ?? 0 },
    });
  }
  if (sleep_long_today) {
    insights.push({
      severity: "info",
      key: "sleep_long",
      payload: { hours: today.sleep_hours ?? 0 },
    });
  }
  if (insights.length === 0 && daysWithData >= 2) {
    insights.push({ severity: "info", key: "on_track" });
  }

  return {
    days_with_data: daysWithData,
    avg_kcal_last_3: Math.round(avg_kcal),
    avg_protein_last_3: Math.round(avg_protein),
    kcal_target: kcalTargetToday,
    protein_target: proteinTarget,
    kcal_deficit_pct,
    protein_deficit_pct,
    consecutive_easy_or_liquid,
    missed_meals_yesterday,
    stimulant_in_last_3d,
    alcohol_in_last_3d,
    sleep_short_today,
    sleep_long_today,
    fatigue_streak,
    protein_boost_g,
    kcal_boost,
    hydration_extra_l,
    insights,
  };
}

function countConsecutive(rollups: DayRollup[], pred: (r: DayRollup) => boolean): number {
  let count = 0;
  for (const r of rollups) {
    if (pred(r)) count++;
    else break;
  }
  return count;
}
