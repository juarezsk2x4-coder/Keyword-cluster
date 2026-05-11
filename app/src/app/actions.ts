"use server";

import { revalidatePath } from "next/cache";
import { getDb, ensureMigrated } from "@/lib/db";
import type { CardState, MealSlot } from "@/lib/types";

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

export async function logSleep(hours: number, quality?: number) {
  await ensureMigrated();
  const date = todayIso();
  await getDb().execute({
    sql: `INSERT INTO sleep_logs (date, hours, quality, logged_at) VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(date) DO UPDATE SET hours = excluded.hours, quality = excluded.quality, logged_at = datetime('now')`,
    args: [date, hours, quality ?? null],
  });
  revalidatePath("/");
}

export async function logSubstance(input: {
  substance: "cocaine" | "alcohol" | "cannabis" | "tobacco" | "benzo" | "psychedelic" | "ketamine";
  amount?: string;
  notes?: string;
}) {
  await ensureMigrated();
  const date = todayIso();
  await getDb().execute({
    sql: `INSERT INTO substance_logs (date, substance, amount, notes, logged_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    args: [date, input.substance, input.amount ?? null, input.notes ?? null],
  });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logFatigue() {
  await ensureMigrated();
  const date = todayIso();
  await getDb().execute({
    sql: `INSERT INTO fatigue_logs (date, logged_at) VALUES (?, datetime('now'))
          ON CONFLICT(date) DO UPDATE SET logged_at = datetime('now')`,
    args: [date],
  });
  revalidatePath("/");
}

export async function clearFatigue() {
  await ensureMigrated();
  const date = todayIso();
  await getDb().execute({ sql: `DELETE FROM fatigue_logs WHERE date = ?`, args: [date] });
  revalidatePath("/");
}

export async function logPrepTime(minutes: number) {
  await ensureMigrated();
  const date = todayIso();
  await getDb().execute({
    sql: `INSERT INTO prep_time_logs (date, available_minutes, logged_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(date) DO UPDATE SET available_minutes = excluded.available_minutes, logged_at = datetime('now')`,
    args: [date, minutes],
  });
  revalidatePath("/");
}
