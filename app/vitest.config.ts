import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // db.ts reads TURSO_DATABASE_URL at module-load time, so it has to be set
    // in the environment before any test module imports it — setting it inside
    // a test file is too late, since ESM hoists imports above statements.
    env: {
      TURSO_DATABASE_URL: "file:./.vitest-tmp.db",
      // Deliberately NOT UTC. The date helpers are supposed to be independent
      // of the host timezone, and running the suite east of UTC is what
      // catches the local-time/UTC-read bug class that shipped once already.
      TZ: "Asia/Tokyo",
    },
    // The DB-backed tests share one SQLite file and truncate the tables they
    // use, so they must not run concurrently with each other.
    fileParallelism: false,
  },
});
