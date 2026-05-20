"use server";

import { revalidatePath } from "next/cache";
import { getDb, ensureMigrated } from "@/lib/db";
import type { CardState, MealSlot, DailyPlan } from "@/lib/types";
import { estimateNutrition, isAiEnabled, type NutritionEstimate } from "@/lib/nutrition-ai";
import {
  generateWeeklyPlan,
  isAiEnabled as isPlanAiEnabled,
  type RecentLogSummary,
  type ProfileSummary,
} from "@/lib/meal-plan-ai";
import { loadPersonA } from "@/lib/profile";
import {
  getMealLogsInRange,
  getSleepLogsInRange,
  getSubstanceLogsInRange,
  getFatigueDatesInRange,
} from "@/lib/query";
import { MEAL_SLOTS } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function logMeal(input: {
  date?: string;
  slot: MealSlot;
  selected_state: CardState;
  actual_label?: string;
  kcal?: number;
  protein_g?: number;
  notes?: string;
}) {
  await ensureMigrated();
  const date = input.date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO meal_logs (date, slot, selected_state, actual_label, kcal, protein_g, notes, logged_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(date, slot) DO UPDATE SET
            selected_state = excluded.selected_state,
            actual_label = excluded.actual_label,
            kcal = excluded.kcal,
            protein_g = excluded.protein_g,
            notes = excluded.notes,
            logged_at = datetime('now')`,
    args: [date, input.slot, input.selected_state, input.actual_label ?? null, input.kcal ?? null, input.protein_g ?? null, input.notes ?? null],
  });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteMealLog(date: string, slot: MealSlot) {
  await ensureMigrated();
  await getDb().execute({ sql: `DELETE FROM meal_logs WHERE date = ? AND slot = ?`, args: [date, slot] });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logSleep(hours: number, date?: string, quality?: number) {
  await ensureMigrated();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO sleep_logs (date, hours, quality, logged_at) VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(date) DO UPDATE SET hours = excluded.hours, quality = excluded.quality, logged_at = datetime('now')`,
    args: [d, hours, quality ?? null],
  });
  revalidatePath("/");
}

export async function logSubstance(input: {
  date?: string;
  substance: "cocaine" | "alcohol" | "cannabis" | "tobacco" | "benzo" | "psychedelic" | "ketamine";
  amount?: string;
  notes?: string;
}) {
  await ensureMigrated();
  const d = input.date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO substance_logs (date, substance, amount, notes, logged_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    args: [d, input.substance, input.amount ?? null, input.notes ?? null],
  });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteSubstanceLog(id: number) {
  await ensureMigrated();
  await getDb().execute({ sql: `DELETE FROM substance_logs WHERE id = ?`, args: [id] });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logFatigue(date?: string) {
  await ensureMigrated();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO fatigue_logs (date, logged_at) VALUES (?, datetime('now'))
          ON CONFLICT(date) DO UPDATE SET logged_at = datetime('now')`,
    args: [d],
  });
  revalidatePath("/");
}

export async function clearFatigue(date?: string) {
  await ensureMigrated();
  const d = date ?? todayIso();
  await getDb().execute({ sql: `DELETE FROM fatigue_logs WHERE date = ?`, args: [d] });
  revalidatePath("/");
}

export async function logPrepTime(minutes: number, date?: string) {
  await ensureMigrated();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO prep_time_logs (date, available_minutes, logged_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(date) DO UPDATE SET available_minutes = excluded.available_minutes, logged_at = datetime('now')`,
    args: [d, minutes],
  });
  revalidatePath("/");
}

export async function logBeverage(input: {
  date?: string;
  type: "mate" | "coffee" | "tea" | "treat";
  amount?: string;
  consumed_at?: string;     // ISO datetime; defaults to now
  notes?: string;
}) {
  await ensureMigrated();
  const d = input.date ?? todayIso();
  const consumed = input.consumed_at ?? new Date().toISOString();
  await getDb().execute({
    sql: `INSERT INTO beverage_logs (date, type, amount, consumed_at, notes, logged_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    args: [d, input.type, input.amount ?? null, consumed, input.notes ?? null],
  });
  revalidatePath("/");
}

export async function deleteBeverageLog(id: number) {
  await ensureMigrated();
  await getDb().execute({ sql: `DELETE FROM beverage_logs WHERE id = ?`, args: [id] });
  revalidatePath("/");
}

export async function estimateNutritionAction(
  description: string,
  lang: "pt" | "en"
): Promise<{ ok: true; data: NutritionEstimate } | { ok: false; error: string }> {
  if (!isAiEnabled()) {
    return { ok: false, error: "ai_disabled" };
  }
  try {
    const data = await estimateNutrition(description, lang);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, error: message };
  }
}

export async function isAiEnabledAction(): Promise<boolean> {
  return isAiEnabled();
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function buildRecentLogSummaries(endIsoExclusive: string): Promise<RecentLogSummary[]> {
  const start = shiftDate(endIsoExclusive, -7);
  const end = shiftDate(endIsoExclusive, -1);
  const [meals, sleeps, subs, fatigueDates] = await Promise.all([
    getMealLogsInRange(start, end),
    getSleepLogsInRange(start, end),
    getSubstanceLogsInRange(start, end),
    getFatigueDatesInRange(start, end),
  ]);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) dates.push(shiftDate(start, i));
  return dates.map((d) => {
    const dayMeals = meals.filter((m) => m.date === d);
    const stateCounts: Record<string, number> = {};
    for (const m of dayMeals) {
      stateCounts[m.selected_state] = (stateCounts[m.selected_state] ?? 0) + 1;
    }
    const sleepRow = sleeps.find((s) => s.date === d);
    return {
      date: d,
      meals_logged: dayMeals.length,
      total_kcal: dayMeals.reduce((a, m) => a + (m.kcal ?? 0), 0),
      total_protein_g: dayMeals.reduce((a, m) => a + (m.protein_g ?? 0), 0),
      missed_slots: MEAL_SLOTS.filter((s) => !dayMeals.find((m) => m.slot === s)),
      state_counts: stateCounts,
      substances: subs.filter((s) => s.date === d).map((s) => s.substance),
      sleep_hours: sleepRow?.hours ?? null,
      was_fatigued: fatigueDates.includes(d),
    };
  });
}

function profileToSummary(): ProfileSummary {
  const p = loadPersonA();
  return {
    hard_no: p.food_preferences.hard_no ?? [],
    texture_aversions: p.food_preferences.texture_aversions ?? [],
    soft_dislikes: p.food_preferences.soft_dislikes ?? [],
    medical_flags: p.medical_flags ?? [],
    protein_g_target: p.nutrition_targets.protein_g_per_day,
    hydration_l_target: p.nutrition_targets.hydration_l_per_day,
    kcal_target_off: p.nutrition_targets.total_kcal_target_off_day,
    kcal_target_skate: p.nutrition_targets.total_kcal_target_skate_day,
  };
}

export async function generateNextWeekPlanAction(
  weekStartIso: string,
  lang: "pt" | "en"
): Promise<
  | { ok: true; plan: DailyPlan[]; generated_at: string }
  | { ok: false; error: string }
> {
  if (!isPlanAiEnabled()) {
    return { ok: false, error: "ai_disabled" };
  }
  try {
    await ensureMigrated();
    const profile = profileToSummary();
    const recentLogs = await buildRecentLogSummaries(weekStartIso);
    const plan = await generateWeeklyPlan({
      weekStartIso,
      profile,
      recentLogs,
      lang,
    });
    const generatedAt = new Date().toISOString();
    await getDb().execute({
      sql: `INSERT INTO weekly_plans (week_start, plan_json, source, generated_at)
            VALUES (?, ?, 'ai', ?)
            ON CONFLICT(week_start) DO UPDATE SET
              plan_json = excluded.plan_json,
              source = 'ai',
              generated_at = excluded.generated_at`,
      args: [weekStartIso, JSON.stringify(plan), generatedAt],
    });
    revalidatePath("/");
    revalidatePath("/plan");
    return { ok: true, plan, generated_at: generatedAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, error: message };
  }
}

export async function deleteStoredWeeklyPlanAction(weekStartIso: string): Promise<void> {
  await ensureMigrated();
  await getDb().execute({
    sql: `DELETE FROM weekly_plans WHERE week_start = ?`,
    args: [weekStartIso],
  });
  revalidatePath("/");
  revalidatePath("/plan");
}
