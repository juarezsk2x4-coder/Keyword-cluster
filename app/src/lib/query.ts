import { getDb } from "./db";
import type { MealLog, SleepLog, SubstanceLog } from "./types";

export function getTodayMealLogs(date: string): MealLog[] {
  return getDb().prepare(`SELECT * FROM meal_logs WHERE date = ? ORDER BY slot`).all(date) as MealLog[];
}

export function getTodaySleep(date: string): SleepLog | undefined {
  return getDb().prepare(`SELECT * FROM sleep_logs WHERE date = ?`).get(date) as SleepLog | undefined;
}

export function getTodaySubstances(date: string): SubstanceLog[] {
  return getDb().prepare(`SELECT * FROM substance_logs WHERE date = ? ORDER BY logged_at DESC`).all(date) as SubstanceLog[];
}

export function getYesterdaySubstances(date: string): SubstanceLog[] {
  const yest = new Date(date + "T00:00:00");
  yest.setDate(yest.getDate() - 1);
  const yIso = yest.toISOString().slice(0, 10);
  return getDb().prepare(`SELECT * FROM substance_logs WHERE date = ? ORDER BY logged_at DESC`).all(yIso) as SubstanceLog[];
}

export function getFatigueToday(date: string): boolean {
  const row = getDb().prepare(`SELECT 1 as v FROM fatigue_logs WHERE date = ?`).get(date) as { v: number } | undefined;
  return !!row;
}

export function getPrepMinutesToday(date: string): number | null {
  const row = getDb().prepare(`SELECT available_minutes FROM prep_time_logs WHERE date = ?`).get(date) as { available_minutes: number } | undefined;
  return row?.available_minutes ?? null;
}

export function getRecentMealLogs(limit = 30): MealLog[] {
  return getDb().prepare(`SELECT * FROM meal_logs ORDER BY date DESC, slot ASC LIMIT ?`).all(limit) as MealLog[];
}

export function getDailyTotals(date: string): { kcal: number; protein_g: number } {
  const row = getDb().prepare(
    `SELECT COALESCE(SUM(kcal), 0) as kcal, COALESCE(SUM(protein_g), 0) as protein_g FROM meal_logs WHERE date = ?`
  ).get(date) as { kcal: number; protein_g: number };
  return row;
}
