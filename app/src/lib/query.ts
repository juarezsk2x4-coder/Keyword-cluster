import { getDb, ensureMigrated } from "./db";
import type { MealLog, SleepLog, SubstanceLog, BeverageLog, PersonId } from "./types";

export async function getDayBeverages(personId: PersonId, date: string): Promise<BeverageLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT * FROM beverage_logs WHERE person_id = ? AND date = ? ORDER BY consumed_at DESC`,
    args: [personId, date],
  });
  return r.rows as unknown as BeverageLog[];
}

export async function getDayMealLogs(personId: PersonId, date: string): Promise<MealLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT * FROM meal_logs WHERE person_id = ? AND date = ? ORDER BY slot`,
    args: [personId, date],
  });
  return r.rows as unknown as MealLog[];
}

export async function getDaySleep(personId: PersonId, date: string): Promise<SleepLog | undefined> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT * FROM sleep_logs WHERE person_id = ? AND date = ?`,
    args: [personId, date],
  });
  return r.rows[0] as unknown as SleepLog | undefined;
}

export async function getDaySubstances(personId: PersonId, date: string): Promise<SubstanceLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT * FROM substance_logs WHERE person_id = ? AND date = ? ORDER BY logged_at DESC`,
    args: [personId, date],
  });
  return r.rows as unknown as SubstanceLog[];
}

export async function getPreviousDaySubstances(personId: PersonId, date: string): Promise<SubstanceLog[]> {
  await ensureMigrated();
  const yest = new Date(date + "T00:00:00");
  yest.setDate(yest.getDate() - 1);
  const yIso = yest.toISOString().slice(0, 10);
  const r = await getDb().execute({
    sql: `SELECT * FROM substance_logs WHERE person_id = ? AND date = ? ORDER BY logged_at DESC`,
    args: [personId, yIso],
  });
  return r.rows as unknown as SubstanceLog[];
}

export async function getDayFatigue(personId: PersonId, date: string): Promise<boolean> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT 1 as v FROM fatigue_logs WHERE person_id = ? AND date = ?`,
    args: [personId, date],
  });
  return r.rows.length > 0;
}

export async function getDayPrepMinutes(personId: PersonId, date: string): Promise<number | null> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT available_minutes FROM prep_time_logs WHERE person_id = ? AND date = ?`,
    args: [personId, date],
  });
  const row = r.rows[0] as unknown as { available_minutes: number } | undefined;
  return row?.available_minutes ?? null;
}

export async function getDayTotals(personId: PersonId, date: string): Promise<{ kcal: number; protein_g: number }> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT COALESCE(SUM(kcal), 0) as kcal, COALESCE(SUM(protein_g), 0) as protein_g FROM meal_logs WHERE person_id = ? AND date = ?`,
    args: [personId, date],
  });
  const row = r.rows[0] as unknown as { kcal: number; protein_g: number };
  return { kcal: Number(row.kcal ?? 0), protein_g: Number(row.protein_g ?? 0) };
}

export async function getMealLogsBetween(personId: PersonId, startIso: string, endIso: string): Promise<MealLog[]> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT * FROM meal_logs WHERE person_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, slot ASC`,
    args: [personId, startIso, endIso],
  });
  return r.rows as unknown as MealLog[];
}

export async function getMealLogsForPast(personId: PersonId, endIso: string, days: number): Promise<MealLog[]> {
  await ensureMigrated();
  const end = new Date(endIso + "T00:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  return getMealLogsBetween(personId, start.toISOString().slice(0, 10), endIso);
}

export interface StoredWeeklyPlan {
  person_id: PersonId;
  week_start: string;
  plan_json: string;
  source: "seed" | "ai";
  generated_at: string;
}

export async function getStoredWeeklyPlan(personId: PersonId, weekStart: string): Promise<StoredWeeklyPlan | null> {
  await ensureMigrated();
  const r = await getDb().execute({
    sql: `SELECT * FROM weekly_plans WHERE person_id = ? AND week_start = ?`,
    args: [personId, weekStart],
  });
  return (r.rows[0] as unknown as StoredWeeklyPlan | undefined) ?? null;
}

export async function saveWeeklyPlan(
  personId: PersonId,
  weekStart: string,
  planJson: string,
  source: "seed" | "ai"
): Promise<void> {
  await ensureMigrated();
  await getDb().execute({
    sql: `INSERT INTO weekly_plans (person_id, week_start, plan_json, source, generated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(person_id, week_start) DO UPDATE SET
            plan_json = excluded.plan_json,
            source = excluded.source,
            generated_at = datetime('now')`,
    args: [personId, weekStart, planJson, source],
  });
}

export async function getSleepLogsForPast(personId: PersonId, endIso: string, days: number): Promise<SleepLog[]> {
  await ensureMigrated();
  const end = new Date(endIso + "T00:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const r = await getDb().execute({
    sql: `SELECT * FROM sleep_logs WHERE person_id = ? AND date >= ? AND date <= ? ORDER BY date DESC`,
    args: [personId, start.toISOString().slice(0, 10), endIso],
  });
  return r.rows as unknown as SleepLog[];
}

export async function getSubstanceLogsForPast(personId: PersonId, endIso: string, days: number): Promise<SubstanceLog[]> {
  await ensureMigrated();
  const end = new Date(endIso + "T00:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const r = await getDb().execute({
    sql: `SELECT * FROM substance_logs WHERE person_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, logged_at DESC`,
    args: [personId, start.toISOString().slice(0, 10), endIso],
  });
  return r.rows as unknown as SubstanceLog[];
}

export async function getFatigueDatesForPast(personId: PersonId, endIso: string, days: number): Promise<string[]> {
  await ensureMigrated();
  const end = new Date(endIso + "T00:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const r = await getDb().execute({
    sql: `SELECT date FROM fatigue_logs WHERE person_id = ? AND date >= ? AND date <= ?`,
    args: [personId, start.toISOString().slice(0, 10), endIso],
  });
  return (r.rows as unknown as { date: string }[]).map((row) => row.date);
}
