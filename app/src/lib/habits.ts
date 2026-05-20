import {
  getMealLogsInRange,
  getSleepLogsInRange,
  getSubstanceLogsInRange,
  getFatigueDatesInRange,
} from "./query";
import { MEAL_SLOTS } from "./types";
import type { CardState, MealSlot } from "./types";

const PROTEIN_TARGET = 130;
const KCAL_TARGET_NORMAL = 2500;

export type HabitWindow = 7 | 14 | 30;

export interface HabitInsight {
  severity: "info" | "warning" | "alert";
  key:
    | "chronic_protein_deficit"
    | "chronic_kcal_deficit"
    | "most_missed_slot"
    | "weekend_heavier"
    | "workday_lighter"
    | "sleep_short_pattern"
    | "on_track";
  payload?: Record<string, string | number>;
}

export interface HabitRollup {
  window: HabitWindow;
  start: string;
  end: string;
  days_with_data: number;
  avg_kcal: number;
  avg_protein_g: number;
  avg_kcal_by_dow: number[];     // index 0=Sun … 6=Sat; 0 if no data
  avg_protein_by_dow: number[];
  missed_slots_top: { slot: MealSlot; count: number }[];
  state_distribution: Record<CardState, number>;
  avg_kcal_short_sleep: number | null;
  avg_kcal_normal_sleep: number | null;
  avg_kcal_post_substance: number | null;
  max_easy_streak: number;
  fatigue_days: number;
  short_sleep_nights: number;
  insights: HabitInsight[];
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export async function getHabitRollup(endIso: string, windowDays: HabitWindow): Promise<HabitRollup> {
  const start = shiftDate(endIso, -(windowDays - 1));
  const [meals, sleeps, subs, fatigueDates] = await Promise.all([
    getMealLogsInRange(start, endIso),
    getSleepLogsInRange(start, endIso),
    getSubstanceLogsInRange(start, endIso),
    getFatigueDatesInRange(start, endIso),
  ]);

  const dates: string[] = [];
  for (let i = 0; i < windowDays; i++) dates.push(shiftDate(start, i));

  const perDay = dates.map((d) => {
    const dayMeals = meals.filter((m) => m.date === d);
    const totalKcal = dayMeals.reduce((a, m) => a + (m.kcal ?? 0), 0);
    const totalProtein = dayMeals.reduce((a, m) => a + (m.protein_g ?? 0), 0);
    const states = dayMeals.map((m) => m.selected_state);
    const sleepHours = sleeps.find((s) => s.date === d)?.hours ?? null;
    const daySubs = subs.filter((s) => s.date === d);
    const prevSubs = subs.filter((s) => s.date === shiftDate(d, -1));
    const dow = new Date(d + "T00:00:00").getDay();
    const missed = MEAL_SLOTS.filter((s) => !dayMeals.some((m) => m.slot === s));
    return {
      date: d,
      dow,
      meals_logged: dayMeals.length,
      total_kcal: totalKcal,
      total_protein_g: totalProtein,
      states,
      sleep_hours: sleepHours,
      had_substance_yesterday: prevSubs.length > 0,
      had_substance_today: daySubs.length > 0,
      missed,
      was_fatigued: fatigueDates.includes(d),
    };
  });

  const withData = perDay.filter((d) => d.meals_logged > 0);
  const days_with_data = withData.length;
  const avg_kcal = avg(withData.map((d) => d.total_kcal));
  const avg_protein_g = avg(withData.map((d) => d.total_protein_g));

  const avg_kcal_by_dow: number[] = Array(7).fill(0);
  const avg_protein_by_dow: number[] = Array(7).fill(0);
  for (let dow = 0; dow < 7; dow++) {
    const dowDays = withData.filter((d) => d.dow === dow);
    avg_kcal_by_dow[dow] = avg(dowDays.map((d) => d.total_kcal));
    avg_protein_by_dow[dow] = avg(dowDays.map((d) => d.total_protein_g));
  }

  const missedCounts: Record<string, number> = {};
  for (const d of withData) {
    for (const slot of d.missed) {
      missedCounts[slot] = (missedCounts[slot] ?? 0) + 1;
    }
  }
  const missed_slots_top = Object.entries(missedCounts)
    .map(([slot, count]) => ({ slot: slot as MealSlot, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const state_distribution: Record<CardState, number> = {
    original: 0,
    easy: 0,
    liquid: 0,
    no_hunger: 0,
  };
  for (const d of withData) {
    for (const s of d.states) {
      state_distribution[s as CardState] = (state_distribution[s as CardState] ?? 0) + 1;
    }
  }

  const shortSleepDays = withData.filter((d) => d.sleep_hours !== null && d.sleep_hours < 6);
  const normalSleepDays = withData.filter((d) => d.sleep_hours !== null && d.sleep_hours >= 6);
  const avg_kcal_short_sleep = shortSleepDays.length ? avg(shortSleepDays.map((d) => d.total_kcal)) : null;
  const avg_kcal_normal_sleep = normalSleepDays.length ? avg(normalSleepDays.map((d) => d.total_kcal)) : null;

  const postSubDays = withData.filter((d) => d.had_substance_yesterday);
  const avg_kcal_post_substance = postSubDays.length ? avg(postSubDays.map((d) => d.total_kcal)) : null;

  let max_easy_streak = 0;
  let cur = 0;
  for (const d of perDay) {
    const allEasy = d.meals_logged > 0 && d.states.every((s) => s === "easy" || s === "liquid" || s === "no_hunger");
    if (allEasy) {
      cur++;
      if (cur > max_easy_streak) max_easy_streak = cur;
    } else {
      cur = 0;
    }
  }

  const fatigue_days = withData.filter((d) => d.was_fatigued).length;
  const short_sleep_nights = withData.filter((d) => d.sleep_hours !== null && d.sleep_hours < 6).length;

  // Weekday vs weekend
  const weekdayDays = withData.filter((d) => d.dow >= 1 && d.dow <= 5);
  const weekendDays = withData.filter((d) => d.dow === 0 || d.dow === 6);
  const avg_weekday_kcal = weekdayDays.length ? avg(weekdayDays.map((d) => d.total_kcal)) : 0;
  const avg_weekend_kcal = weekendDays.length ? avg(weekendDays.map((d) => d.total_kcal)) : 0;

  const insights: HabitInsight[] = [];

  if (days_with_data >= 3) {
    if (avg_protein_g < PROTEIN_TARGET * 0.85) {
      insights.push({
        severity: "warning",
        key: "chronic_protein_deficit",
        payload: { avg: avg_protein_g, target: PROTEIN_TARGET },
      });
    }
    if (avg_kcal < KCAL_TARGET_NORMAL * 0.85) {
      insights.push({
        severity: "warning",
        key: "chronic_kcal_deficit",
        payload: { avg: avg_kcal, target: KCAL_TARGET_NORMAL },
      });
    }
    if (missed_slots_top[0] && missed_slots_top[0].count >= Math.max(2, Math.floor(days_with_data * 0.4))) {
      insights.push({
        severity: "info",
        key: "most_missed_slot",
        payload: { slot: missed_slots_top[0].slot, count: missed_slots_top[0].count },
      });
    }
    if (avg_weekend_kcal > 0 && avg_weekday_kcal > 0) {
      const delta = avg_weekend_kcal - avg_weekday_kcal;
      if (delta >= 400) {
        insights.push({
          severity: "info",
          key: "weekend_heavier",
          payload: { delta },
        });
      } else if (delta <= -400) {
        insights.push({
          severity: "warning",
          key: "workday_lighter",
          payload: { delta: -delta },
        });
      }
    }
    if (short_sleep_nights >= Math.max(3, Math.floor(days_with_data * 0.35))) {
      insights.push({
        severity: "alert",
        key: "sleep_short_pattern",
        payload: { count: short_sleep_nights },
      });
    }
    if (insights.length === 0) {
      insights.push({ severity: "info", key: "on_track" });
    }
  }

  return {
    window: windowDays,
    start,
    end: endIso,
    days_with_data,
    avg_kcal,
    avg_protein_g,
    avg_kcal_by_dow,
    avg_protein_by_dow,
    missed_slots_top,
    state_distribution,
    avg_kcal_short_sleep,
    avg_kcal_normal_sleep,
    avg_kcal_post_substance,
    max_easy_streak,
    fatigue_days,
    short_sleep_nights,
    insights,
  };
}
