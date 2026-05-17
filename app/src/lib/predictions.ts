import { getDb, ensureMigrated } from "./db";
import type { MealLog, SleepLog, SubstanceLog } from "./types";

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
  kcal_deficit_pct: number;          // negative = under, positive = over (avg vs target)
  protein_deficit_pct: number;
  consecutive_easy_or_liquid: number;
  consecutive_low_kcal_days: number;
  missed_meals_yesterday: string[];
  cocaine_in_last_3d: boolean;
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
    | "sleep_short"
    | "sleep_long"
    | "on_track";
  payload?: Record<string, string | number>;
}

const PROTEIN_TARGET = 130;
const KCAL_TARGET_NORMAL = 2500;
const KCAL_TARGET_SKATE = 3300;

export async function getPredictions(
  todayIso: string,
  isSkateDayToday: boolean
): Promise<Prediction> {
  await ensureMigrated();

  const dates = lastNDates(todayIso, 3);
  const yesterdayIso = dates[1];

  const db = getDb();
  const [mealsResp, sleepResp, subsResp, fatigueResp] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM meal_logs WHERE date IN (?, ?, ?) ORDER BY date DESC, slot ASC`,
      args: dates as [string, string, string],
    }),
    db.execute({
      sql: `SELECT * FROM sleep_logs WHERE date IN (?, ?, ?)`,
      args: dates as [string, string, string],
    }),
    db.execute({
      sql: `SELECT * FROM substance_logs WHERE date IN (?, ?, ?)`,
      args: dates as [string, string, string],
    }),
    db.execute({
      sql: `SELECT * FROM fatigue_logs WHERE date IN (?, ?, ?)`,
      args: dates as [string, string, string],
    }),
  ]);

  const meals = mealsResp.rows as unknown as MealLog[];
  const sleeps = sleepResp.rows as unknown as SleepLog[];
  const subs = subsResp.rows as unknown as SubstanceLog[];
  const fatigues = fatigueResp.rows as unknown as { date: string }[];

  const ALL_SLOTS = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar", "snack_noturno"];

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

  const kcal_deficit_pct = daysWithData > 0
    ? Math.round(((avg_kcal - KCAL_TARGET_NORMAL) / KCAL_TARGET_NORMAL) * 100)
    : 0;
  const protein_deficit_pct = daysWithData > 0
    ? Math.round(((avg_protein - proteinTarget) / proteinTarget) * 100)
    : 0;

  // Streak analysis
  const consecutive_easy_or_liquid = countConsecutive(past, (r) =>
    r.states_picked.length > 0 &&
    r.states_picked.every((s) => s === "easy" || s === "liquid" || s === "no_hunger")
  );
  const consecutive_low_kcal_days = countConsecutive(past, (r) =>
    r.total_kcal > 0 && r.total_kcal < KCAL_TARGET_NORMAL * 0.7
  );
  const fatigue_streak = countConsecutive(past, (r) => r.was_fatigued);

  // Substance / sleep flags
  const yesterday = rollups[1];
  const cocaine_in_last_3d = past.some((r) => r.substances.includes("cocaine"));
  const alcohol_in_last_3d = past.some((r) => r.substances.includes("alcohol"));
  const today = rollups[0];
  const sleep_short_today = today.sleep_hours !== null && today.sleep_hours < 5;
  const sleep_long_today = today.sleep_hours !== null && today.sleep_hours >= 9;

  const missed_meals_yesterday = yesterday.missed_slots;

  // Compute today's adjustments
  let protein_boost_g = 0;
  let kcal_boost = 0;
  let hydration_extra_l = 0;

  if (protein_deficit_pct < -10) {
    protein_boost_g = Math.round(Math.abs(protein_deficit_pct) * 0.5);
  }
  if (kcal_deficit_pct < -15) {
    kcal_boost = Math.round(KCAL_TARGET_NORMAL * Math.abs(kcal_deficit_pct) / 100 / 2);
  }
  if (cocaine_in_last_3d || alcohol_in_last_3d) {
    hydration_extra_l += 1;
  }
  if (sleep_short_today) {
    hydration_extra_l += 0.5;
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
  if (consecutive_easy_or_liquid >= 3) {
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
  if (yesterday.substances.includes("cocaine")) {
    insights.push({ severity: "alert", key: "post_substance" });
  }
  if (yesterday.substances.includes("alcohol")) {
    insights.push({ severity: "info", key: "post_alcohol" });
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
    consecutive_low_kcal_days,
    missed_meals_yesterday,
    cocaine_in_last_3d,
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

function lastNDates(todayIso: string, n: number): string[] {
  const out: string[] = [];
  const base = new Date(todayIso + "T00:00:00");
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function countConsecutive(rollups: DayRollup[], pred: (r: DayRollup) => boolean): number {
  let count = 0;
  for (const r of rollups) {
    if (pred(r)) count++;
    else break;
  }
  return count;
}
