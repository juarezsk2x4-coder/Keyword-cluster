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
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      selected_state TEXT NOT NULL,
      actual_label TEXT,
      kcal INTEGER,
      protein_g REAL,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date, slot)
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      quality INTEGER,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    );

    CREATE TABLE IF NOT EXISTS substance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      substance TEXT NOT NULL,
      amount TEXT,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fatigue_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    );

    CREATE TABLE IF NOT EXISTS prep_time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      available_minutes INTEGER NOT NULL,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    );

    CREATE TABLE IF NOT EXISTS beverage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount TEXT,
      consumed_at TEXT NOT NULL,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      person_id TEXT NOT NULL DEFAULT 'person_a',
      week_start TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      source TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (person_id, week_start)
    );
  `);

  // Must run before index creation: on a pre-existing (legacy) DB, the indexes
  // below reference person_id, which legacy tables don't have yet until this
  // backfills it.
  await migrateLegacyTables(c);

  await c.executeMultiple(`
    CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(person_id, date);
    CREATE INDEX IF NOT EXISTS idx_substance_logs_date ON substance_logs(person_id, date);
    CREATE INDEX IF NOT EXISTS idx_beverage_logs_date ON beverage_logs(person_id, date);
  `);

  initialized = true;
}

const UNIQUE_CONSTRAINED_TABLES: Record<string, string> = {
  meal_logs: `
    CREATE TABLE meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      selected_state TEXT NOT NULL,
      actual_label TEXT,
      kcal INTEGER,
      protein_g REAL,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date, slot)
    )`,
  sleep_logs: `
    CREATE TABLE sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      quality INTEGER,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    )`,
  fatigue_logs: `
    CREATE TABLE fatigue_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    )`,
  prep_time_logs: `
    CREATE TABLE prep_time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      available_minutes INTEGER NOT NULL,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date)
    )`,
  weekly_plans: `
    CREATE TABLE weekly_plans (
      person_id TEXT NOT NULL DEFAULT 'person_a',
      week_start TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      source TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (person_id, week_start)
    )`,
};

const SIMPLE_ALTER_TABLES = ["substance_logs", "beverage_logs"];

async function migrateLegacyTables(c: Client) {
  for (const table of Object.keys(UNIQUE_CONSTRAINED_TABLES)) {
    if (await hasPersonIdColumn(c, table)) continue;
    const createSql = UNIQUE_CONSTRAINED_TABLES[table].replace(
      new RegExp(`CREATE TABLE ${table}`),
      `CREATE TABLE ${table}_new`
    );
    const columns = await getColumnNames(c, table);
    const insertCols = ["person_id", ...columns.filter((col) => col !== "person_id")];
    await c.executeMultiple(`
      ${createSql};
      INSERT INTO ${table}_new (${insertCols.join(", ")})
        SELECT 'person_a', ${columns.join(", ")} FROM ${table};
      DROP TABLE ${table};
      ALTER TABLE ${table}_new RENAME TO ${table};
    `);
  }

  for (const table of SIMPLE_ALTER_TABLES) {
    if (await hasPersonIdColumn(c, table)) continue;
    await c.execute(`ALTER TABLE ${table} ADD COLUMN person_id TEXT NOT NULL DEFAULT 'person_a'`);
  }
}

async function hasPersonIdColumn(c: Client, table: string): Promise<boolean> {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  return (info.rows as unknown as { name: string }[]).some((row) => row.name === "person_id");
}

async function getColumnNames(c: Client, table: string): Promise<string[]> {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  return (info.rows as unknown as { name: string }[]).map((row) => row.name);
}
