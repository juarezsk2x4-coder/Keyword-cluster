"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
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
  const db = getDb();
  const date = input.date ?? todayIso();
  db.prepare(
    `INSERT INTO meal_logs (date, slot, selected_state, actual_label, kcal, protein_g, notes, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(date, slot) DO UPDATE SET
       selected_state = excluded.selected_state,
       actual_label = excluded.actual_label,
       kcal = excluded.kcal,
       protein_g = excluded.protein_g,
       notes = excluded.notes,
       logged_at = datetime('now')`
  ).run(date, input.slot, input.selected_state, input.actual_label ?? null, input.kcal ?? null, input.protein_g ?? null, input.notes ?? null);
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteMealLog(date: string, slot: MealSlot) {
  const db = getDb();
  db.prepare(`DELETE FROM meal_logs WHERE date = ? AND slot = ?`).run(date, slot);
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logSleep(hours: number, quality?: number) {
  const db = getDb();
  const date = todayIso();
  db.prepare(
    `INSERT INTO sleep_logs (date, hours, quality, logged_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET hours = excluded.hours, quality = excluded.quality, logged_at = datetime('now')`
  ).run(date, hours, quality ?? null);
  revalidatePath("/");
}

export async function logSubstance(input: {
  substance: "cocaine" | "alcohol" | "cannabis" | "tobacco" | "benzo" | "psychedelic" | "ketamine";
  amount?: string;
  notes?: string;
}) {
  const db = getDb();
  const date = todayIso();
  db.prepare(
    `INSERT INTO substance_logs (date, substance, amount, notes, logged_at) VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(date, input.substance, input.amount ?? null, input.notes ?? null);
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logFatigue() {
  const db = getDb();
  const date = todayIso();
  db.prepare(
    `INSERT INTO fatigue_logs (date, logged_at) VALUES (?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET logged_at = datetime('now')`
  ).run(date);
  revalidatePath("/");
}

export async function clearFatigue() {
  const db = getDb();
  const date = todayIso();
  db.prepare(`DELETE FROM fatigue_logs WHERE date = ?`).run(date);
  revalidatePath("/");
}

export async function logPrepTime(minutes: number) {
  const db = getDb();
  const date = todayIso();
  db.prepare(
    `INSERT INTO prep_time_logs (date, available_minutes, logged_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET available_minutes = excluded.available_minutes, logged_at = datetime('now')`
  ).run(date, minutes);
  revalidatePath("/");
}
