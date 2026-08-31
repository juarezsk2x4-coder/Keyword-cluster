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

export function getSundayOfWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function getNextSunday(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
