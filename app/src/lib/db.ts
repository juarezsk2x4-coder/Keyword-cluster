import { createClient, type Client } from "@libsql/client";

// On Vercel, a local SQLite file doesn't persist between requests (ephemeral,
// read-only filesystem outside /tmp) — silently falling back to one there
// would either throw deep inside a random request or quietly drop every
// write. Fail loudly at startup instead so a missing env var is obvious.
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. On Vercel this app requires a real Turso " +
      "database — see DEPLOY.md. (Local dev without it falls back to a SQLite " +
      "file, which only works with a persistent filesystem.)"
  );
}

const url = process.env.TURSO_DATABASE_URL || "file:./data/app.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

let clientInstance: Client | null = null;
let initialized = false;
let migrationPromise: Promise<void> | null = null;

export function getDb(): Client {
  if (clientInstance) return clientInstance;
  clientInstance = createClient({ url, authToken });
  return clientInstance;
}

export async function ensureMigrated() {
  if (initialized) return;
  // Concurrent requests in the same process (e.g. a cold start handling
  // several parallel calls) share one in-flight migration instead of each
  // racing through migrateLegacyTables independently.
  if (migrationPromise) return migrationPromise;
  migrationPromise = runMigration().catch((err) => {
    migrationPromise = null; // allow a retry on the next request instead of wedging forever
    console.error(`[db] migration failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  });
  await migrationPromise;
}

async function runMigration() {
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

    CREATE TABLE IF NOT EXISTS weather_cache (
      date TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      condition TEXT NOT NULL,
      temp_max_c REAL NOT NULL,
      temp_min_c REAL NOT NULL,
      precip_prob_pct INTEGER NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplement_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      supplement_name TEXT NOT NULL,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date, supplement_name)
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT NOT NULL DEFAULT 'person_a',
      date TEXT NOT NULL,
      exercise_type TEXT NOT NULL,
      custom_label TEXT NOT NULL DEFAULT '',
      duration_minutes INTEGER,
      logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, date, exercise_type, custom_label)
    );
  `);

  // Must run before index creation: on a pre-existing (legacy) DB, the indexes
  // below reference person_id, which legacy tables don't have yet until this
  // backfills it.
  await migrateLegacyTables(c);

  // exercise_logs already existed in production before duration_minutes was
  // added — CREATE TABLE IF NOT EXISTS above is a no-op there, so backfill
  // the column by hand the same way SIMPLE_ALTER_TABLES does.
  if (!(await hasColumn(c, "exercise_logs", "duration_minutes"))) {
    await c.execute(`ALTER TABLE exercise_logs ADD COLUMN duration_minutes INTEGER`);
  }

  await c.executeMultiple(`
    CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(person_id, date);
    CREATE INDEX IF NOT EXISTS idx_substance_logs_date ON substance_logs(person_id, date);
    CREATE INDEX IF NOT EXISTS idx_beverage_logs_date ON beverage_logs(person_id, date);
    CREATE INDEX IF NOT EXISTS idx_supplement_logs_date ON supplement_logs(person_id, date);
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_date ON exercise_logs(person_id, date);
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
  // Each table's rename→create→copy→drop→rename runs as a single atomic
  // batch (real transaction) so a mid-migration failure (e.g. a dropped
  // remote connection) can't leave an orphaned "<table>_new" with the
  // original table gone — either the whole swap lands, or none of it does.
  for (const table of Object.keys(UNIQUE_CONSTRAINED_TABLES)) {
    if (await hasPersonIdColumn(c, table)) continue;
    const createSql = UNIQUE_CONSTRAINED_TABLES[table].replace(
      new RegExp(`CREATE TABLE ${table}`),
      `CREATE TABLE ${table}_new`
    );
    const columns = await getColumnNames(c, table);
    const insertCols = ["person_id", ...columns.filter((col) => col !== "person_id")];
    await c.batch(
      [
        createSql,
        `INSERT INTO ${table}_new (${insertCols.join(", ")})
           SELECT 'person_a', ${columns.join(", ")} FROM ${table}`,
        `DROP TABLE ${table}`,
        `ALTER TABLE ${table}_new RENAME TO ${table}`,
      ],
      "write"
    );
  }

  for (const table of SIMPLE_ALTER_TABLES) {
    if (await hasPersonIdColumn(c, table)) continue;
    await c.execute(`ALTER TABLE ${table} ADD COLUMN person_id TEXT NOT NULL DEFAULT 'person_a'`);
  }
}

async function hasPersonIdColumn(c: Client, table: string): Promise<boolean> {
  return hasColumn(c, table, "person_id");
}

async function hasColumn(c: Client, table: string, column: string): Promise<boolean> {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  return (info.rows as unknown as { name: string }[]).some((row) => row.name === column);
}

async function getColumnNames(c: Client, table: string): Promise<string[]> {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  return (info.rows as unknown as { name: string }[]).map((row) => row.name);
}
