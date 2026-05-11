import { getDb, ensureMigrated } from "./db";
import type { MealLog, SleepLog, SubstanceLog } from "./types";

export async function getTodayMealLogs(date: string): Promise<MealLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({ sql: `SELECT * FROM meal_logs WHERE date = ? ORDER BY slot`, args: [date] });
  return r.rows as unknown as MealLog[];
}

export async function getTodaySleep(date: string): Promise<SleepLog | undefined> {
  await ensureMigrated();
  const r = await getDb().execute({ sql: `SELECT * FROM sleep_logs WHERE date = ?`, args: [date] });
  return r.rows[0] as unknown as SleepLog | undefined;
}

export async function getTodaySubstances(date: string): Promise<SubstanceLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({ sql: `SELECT * FROM substance_logs WHERE date = ? ORDER BY logged_at DESC`, args: [date] });
  return r.rows as unknown as SubstanceLog[];
}

export async function getYesterdaySubstances(date: string): Promise<SubstanceLog[]> {
  await ensureMigrated();
  const yest = new Date(date + "T00:00:00");
  yest.setDate(yest.getDate() - 1);
  const yIso = yest.toISOString().slice(0, 10);
  const r = await getDb().execute({ sql: `SELECT * FROM substance_logs WHERE date = ? ORDER BY logged_at DESC`, args: [yIso] });
  return r.rows as unknown as SubstanceLog[];
}

export async function getFatigueToday(date: string): Promise<boolean> {
  await ensureMigrated();
  const r = await getDb().execute({ sql: `SELECT 1 as v FROM fatigue_logs WHERE date = ?`, args: [date] });
  return r.rows.length > 0;
}

export async function getPrepMinutesToday(date: string): Promise<number | null> {
  await ensureMigrated();
  const r = await getDb().execute({ sql: `SELECT available_minutes FROM prep_time_logs WHERE date = ?`, args: [date] });
  const row = r.rows[0] as unknown as { available_minutes: number } | undefined;
  return row?.available_minutes ?? null;
}

export async function getRecentMealLogs(limit = 30): Promise<MealLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({ sql: `SELECT * FROM meal_logs ORDER BY date DESC, slot ASC LIMIT ?`, args: [limit] });
  return r.rows as unknown as MealLog[];
}

export async function getDailyTotals(date: string): Promise<{ kcal: number; protein_g: number }> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT COALESCE(SUM(kcal), 0) as kcal, COALESCE(SUM(protein_g), 0) as protein_g FROM meal_logs WHERE date = ?`,
    args: [date],
  });
  const row = r.rows[0] as unknown as { kcal: number; protein_g: number };
  return { kcal: Number(row.kcal ?? 0), protein_g: Number(row.protein_g ?? 0) };
}
