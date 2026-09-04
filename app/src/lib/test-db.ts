import { getDb, ensureMigrated } from "./db";
import type { PersonId } from "./types";

// Shared helpers for the DB-backed tests. TURSO_DATABASE_URL points at a
// throwaway SQLite file (see vitest.config.ts); these just give each test a
// clean slate and a terse way to seed rows.

const LOG_TABLES = [
  "meal_logs",
  "sleep_logs",
  "substance_logs",
  "fatigue_logs",
  "prep_time_logs",
  "beverage_logs",
  "weekly_plans",
  "supplement_logs",
  "exercise_logs",
  "weather_cache",
];

export async function resetDb() {
  await ensureMigrated();
  const db = getDb();
  for (const table of LOG_TABLES) {
    await db.execute(`DELETE FROM ${table}`);
  }
}

export async function seedMeal(opts: {
  person?: PersonId;
  date: string;
  slot: string;
  kcal: number;
  protein?: number;
  state?: string;
}) {
  await getDb().execute({
    sql: `INSERT INTO meal_logs (person_id, date, slot, selected_state, kcal, protein_g, logged_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(person_id, date, slot) DO UPDATE SET
            kcal = excluded.kcal, protein_g = excluded.protein_g, selected_state = excluded.selected_state`,
    args: [
      opts.person ?? "person_a",
      opts.date,
      opts.slot,
      opts.state ?? "original",
      opts.kcal,
      opts.protein ?? 0,
    ],
  });
}

// Fills a whole day to a given kcal/protein total by splitting it across all
// six slots, so `daysWithData` counts the day and the totals are predictable.
export async function seedFullDay(date: string, kcal: number, protein: number, state = "original") {
  const slots = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar", "snack_noturno"];
  for (let i = 0; i < slots.length; i++) {
    const isLast = i === slots.length - 1;
    // Give the remainder to the last slot so the day sums exactly.
    const share = isLast ? kcal - Math.floor(kcal / 6) * 5 : Math.floor(kcal / 6);
    const pShare = isLast ? protein - Math.floor(protein / 6) * 5 : Math.floor(protein / 6);
    await seedMeal({ date, slot: slots[i], kcal: share, protein: pShare, state });
  }
}

export async function seedExercise(opts: {
  person?: PersonId;
  date: string;
  type: string;
  minutes?: number;
  label?: string;
}) {
  await getDb().execute({
    sql: `INSERT INTO exercise_logs (person_id, date, exercise_type, custom_label, duration_minutes, logged_at)
          VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT DO NOTHING`,
    args: [
      opts.person ?? "person_a",
      opts.date,
      opts.type,
      opts.label ?? "",
      opts.minutes ?? null,
    ],
  });
}

export async function seedSupplement(date: string, name: string, person: PersonId = "person_a") {
  await getDb().execute({
    sql: `INSERT INTO supplement_logs (person_id, date, supplement_name, logged_at)
          VALUES (?, ?, ?, datetime('now')) ON CONFLICT DO NOTHING`,
    args: [person, date, name],
  });
}

export async function seedSubstance(date: string, substance: string, person: PersonId = "person_a") {
  await getDb().execute({
    sql: `INSERT INTO substance_logs (person_id, date, substance, logged_at) VALUES (?, ?, ?, datetime('now'))`,
    args: [person, date, substance],
  });
}

export async function seedSleep(date: string, hours: number, person: PersonId = "person_a") {
  await getDb().execute({
    sql: `INSERT INTO sleep_logs (person_id, date, hours, logged_at) VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(person_id, date) DO UPDATE SET hours = excluded.hours`,
    args: [person, date, hours],
  });
}
