"use server";

import { revalidatePath } from "next/cache";
import { getDb, ensureMigrated } from "@/lib/db";
import type { CardState, MealSlot } from "@/lib/types";
import { estimateNutrition, isAiEnabled, type NutritionEstimate } from "@/lib/nutrition-ai";
import { generateWeeklyPlan, summarizeMealLogs } from "@/lib/meal-plan-ai";
import { getMealLogsForPast, saveWeeklyPlan } from "@/lib/query";
import { loadProfile } from "@/lib/profile";
import { getLang } from "@/lib/lang";
import { getActivePerson } from "@/lib/person";

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
  const personId = await getActivePerson();
  const date = input.date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO meal_logs (person_id, date, slot, selected_state, actual_label, kcal, protein_g, notes, logged_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(person_id, date, slot) DO UPDATE SET
            selected_state = excluded.selected_state,
            actual_label = excluded.actual_label,
            kcal = excluded.kcal,
            protein_g = excluded.protein_g,
            notes = excluded.notes,
            logged_at = datetime('now')`,
    args: [personId, date, input.slot, input.selected_state, input.actual_label ?? null, input.kcal ?? null, input.protein_g ?? null, input.notes ?? null],
  });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteMealLog(date: string, slot: MealSlot) {
  await ensureMigrated();
  const personId = await getActivePerson();
  await getDb().execute({
    sql: `DELETE FROM meal_logs WHERE person_id = ? AND date = ? AND slot = ?`,
    args: [personId, date, slot],
  });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logSleep(hours: number, date?: string, quality?: number) {
  await ensureMigrated();
  const personId = await getActivePerson();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO sleep_logs (person_id, date, hours, quality, logged_at) VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(person_id, date) DO UPDATE SET hours = excluded.hours, quality = excluded.quality, logged_at = datetime('now')`,
    args: [personId, d, hours, quality ?? null],
  });
  revalidatePath("/");
}

export async function logSubstance(input: {
  date?: string;
  substance: "stimulant" | "alcohol" | "cannabis" | "tobacco" | "benzo" | "psychedelic" | "ketamine";
  amount?: string;
  notes?: string;
}) {
  await ensureMigrated();
  const personId = await getActivePerson();
  const d = input.date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO substance_logs (person_id, date, substance, amount, notes, logged_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    args: [personId, d, input.substance, input.amount ?? null, input.notes ?? null],
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
  const personId = await getActivePerson();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO fatigue_logs (person_id, date, logged_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(person_id, date) DO UPDATE SET logged_at = datetime('now')`,
    args: [personId, d],
  });
  revalidatePath("/");
}

export async function clearFatigue(date?: string) {
  await ensureMigrated();
  const personId = await getActivePerson();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `DELETE FROM fatigue_logs WHERE person_id = ? AND date = ?`,
    args: [personId, d],
  });
  revalidatePath("/");
}

export async function logPrepTime(minutes: number, date?: string) {
  await ensureMigrated();
  const personId = await getActivePerson();
  const d = date ?? todayIso();
  await getDb().execute({
    sql: `INSERT INTO prep_time_logs (person_id, date, available_minutes, logged_at) VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(person_id, date) DO UPDATE SET available_minutes = excluded.available_minutes, logged_at = datetime('now')`,
    args: [personId, d, minutes],
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
  const personId = await getActivePerson();
  const d = input.date ?? todayIso();
  const consumed = input.consumed_at ?? new Date().toISOString();
  await getDb().execute({
    sql: `INSERT INTO beverage_logs (person_id, date, type, amount, consumed_at, notes, logged_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [personId, d, input.type, input.amount ?? null, consumed, input.notes ?? null],
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

export async function generateWeekPlanAction(
  weekStart: string
): Promise<{ ok: true; source: "ai"; days: number } | { ok: false; error: string }> {
  if (!isAiEnabled()) {
    return { ok: false, error: "ai_disabled" };
  }
  try {
    const lang = await getLang();
    const personId = await getActivePerson();
    const profile = loadProfile(personId);
    const dayBeforeWeekStart = new Date(weekStart + "T00:00:00");
    dayBeforeWeekStart.setDate(dayBeforeWeekStart.getDate() - 1);
    const priorLogs = await getMealLogsForPast(
      personId,
      dayBeforeWeekStart.toISOString().slice(0, 10),
      7
    );
    const summary = summarizeMealLogs(priorLogs);
    const days = await generateWeeklyPlan(profile, summary, weekStart, lang, personId);
    await saveWeeklyPlan(personId, weekStart, JSON.stringify(days), "ai");
    revalidatePath("/");
    revalidatePath("/plan");
    return { ok: true, source: "ai", days: days.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, error: message };
  }
}

export async function deleteWeekPlanAction(
  weekStart: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await ensureMigrated();
    const personId = await getActivePerson();
    await getDb().execute({
      sql: `DELETE FROM weekly_plans WHERE person_id = ? AND week_start = ?`,
      args: [personId, weekStart],
    });
    revalidatePath("/");
    revalidatePath("/plan");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, error: message };
  }
}
