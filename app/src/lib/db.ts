import { createClient, type Client } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./data/app.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

let clientInstance: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (clientInstance) return clientInstance;
  clientInstance = createClient({ url, authToken });
  return clientInstance;
}

export async function ensureMigrated() {
  if (initialized) return;
  const c = getDb();
  await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      selected_state TEXT NOT NULL,
      actual_label TEXT,
      kcal INTEGER,
      protein_g REAL,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, slot)
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      hours REAL NOT NULL,
      quality INTEGER,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS substance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      substance TEXT NOT NULL,
      amount TEXT,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fatigue_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prep_time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      available_minutes INTEGER NOT NULL,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS beverage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount TEXT,
      consumed_at TEXT NOT NULL,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(date);
    CREATE INDEX IF NOT EXISTS idx_substance_logs_date ON substance_logs(date);
    CREATE INDEX IF NOT EXISTS idx_beverage_logs_date ON beverage_logs(date);
  `);
  initialized = true;
}
