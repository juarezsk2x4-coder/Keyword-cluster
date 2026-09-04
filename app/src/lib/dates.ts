// Centralizes "what date is it right now" on a fixed household timezone
// instead of the server's (UTC on Vercel) — a meal logged at 22:00 in
// São Paulo should count as that evening, not roll over to the next day
// because the server clock is 3 hours ahead.
//
// If your household isn't in this timezone, change APP_TIMEZONE — every
// caller of todayIso() picks it up automatically.

export const APP_TIMEZONE = "America/Sao_Paulo";

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayIso(): string {
  return isoFormatter.format(new Date());
}

// Every helper below does its arithmetic in UTC on purpose. `new Date("2026-09-04T00:00:00")`
// (no Z) is parsed in the *server's* local timezone, and reading it back with
// toISOString() converts to UTC — so on any host east of UTC the date shifted
// backwards by a day. That silently defeated the whole point of this file: with
// TZ=Europe/Berlin, getSundayOfWeek("2026-09-04") returned a Saturday, the
// week's plan was built off the wrong anchor, and the home page fell back to
// rendering Sunday's skate plan (3300 kcal) on every single day of the week.
// Vercel happens to run UTC so production was unaffected, but any dev machine
// east of UTC hit it, and it was one env change away from hitting production.
// Parsing with an explicit "Z" and using the getUTC*/setUTC* accessors makes
// these pure string-in/string-out functions with no local-time involvement.
function parseIsoUtc(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Day of week for a date string, 0 = Sunday. TZ-independent.
export function dowForIso(iso: string): number {
  return parseIsoUtc(iso).getUTCDay();
}

export function getSundayOfWeek(iso: string): string {
  return addDaysIso(iso, -dowForIso(iso));
}

export function getNextSunday(iso: string): string {
  return addDaysIso(iso, 7);
}

// ── Wall-clock time helpers ───────────────────────────────────────────────
// Times used to be rendered with Date#getHours(), which is the *host's* local
// hour — UTC while a Server Component renders, the viewer's zone once it
// hydrates. That produced a React hydration mismatch and showed the wrong hour
// on every logged beverage. Pinning both directions to APP_TIMEZONE makes the
// server and the browser agree, and matches how todayIso() already works.

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTimeInAppTz(instant: Date | string): string {
  return timeFormatter.format(typeof instant === "string" ? new Date(instant) : instant);
}

export function nowTimeInAppTz(): string {
  return formatTimeInAppTz(new Date());
}

// Offset of APP_TIMEZONE at a given instant, in minutes (São Paulo is -180 and
// has had no DST since 2019, but this is derived rather than assumed so
// changing APP_TIMEZONE stays safe).
function appTzOffsetMinutes(at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(at).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - at.getTime()) / 60000;
}

// "2026-09-04" + "20:00" read as a wall clock in APP_TIMEZONE -> UTC ISO instant.
export function appTzWallClockToIso(dateIso: string, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const guess = new Date(`${dateIso}T00:00:00Z`);
  guess.setUTCHours(h ?? 0, m ?? 0, 0, 0);
  return new Date(guess.getTime() - appTzOffsetMinutes(guess) * 60000).toISOString();
}

// N consecutive dates ending at endIso, most recent first.
// Shared by predictions.ts and habits.ts, which each used to carry their own
// copy of this with the local-time bug described above.
export function lastNDates(endIso: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDaysIso(endIso, -i));
}
