import type { NextRequest } from "next/server";
import { resolveWeeklyPlan } from "@/lib/seed-plan";
import { todayIso, getSundayOfWeek, getNextSunday } from "@/lib/dates";
import { SLOT_LABELS } from "@/lib/types";
import type { DailyPlan, PersonId } from "@/lib/types";

// How far ahead to publish events. Calendar clients poll a subscription
// URL on their own schedule (often once every 12-24h) rather than live —
// a wide-enough window means a slow poller still sees everything coming
// up, not just today.
const WINDOW_DAYS = 21;

function isValidPersonId(id: string): id is PersonId {
  return id === "person_a" || id === "person_b";
}

// RFC 5545 §3.3.11 — commas, semicolons and backslashes are structural in
// ICS text values and must be escaped, or a comma in a meal label would
// silently truncate the field for the calendar app parsing it.
function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function toIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// America/Sao_Paulo has been a fixed UTC-3 offset since Brazil abolished
// DST in 2019 — no seasonal offset math needed, just append it.
function localToUtcIcs(dateIso: string, hhmm: string): string {
  return toIcsUtc(new Date(`${dateIso}T${hhmm}:00-03:00`));
}

function addMinutesIcs(dateIso: string, hhmm: string, minutes: number): string {
  const d = new Date(`${dateIso}T${hhmm}:00-03:00`);
  d.setMinutes(d.getMinutes() + minutes);
  return toIcsUtc(d);
}

function buildEvent(opts: { uid: string; dtstamp: string; dtstart: string; dtend: string; summary: string }): string {
  return [
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${opts.dtstamp}`,
    `DTSTART:${opts.dtstart}`,
    `DTEND:${opts.dtend}`,
    `SUMMARY:${escapeIcsText(opts.summary)}`,
    "END:VEVENT",
  ].join("\r\n");
}

async function collectDays(personId: PersonId): Promise<DailyPlan[]> {
  const start = todayIso();
  const endExclusiveDate = new Date(start + "T00:00:00");
  endExclusiveDate.setDate(endExclusiveDate.getDate() + WINDOW_DAYS);
  const endExclusive = endExclusiveDate.toISOString().slice(0, 10);

  const seen = new Set<string>();
  const days: DailyPlan[] = [];
  let weekStart = getSundayOfWeek(start);
  // Bounded by WINDOW_DAYS/7 + 1 — this loop always terminates in a few
  // iterations, not an actual risk of running away.
  while (weekStart < endExclusive) {
    const resolved = await resolveWeeklyPlan(personId, weekStart);
    for (const day of resolved.days) {
      if (day.date >= start && day.date < endExclusive && !seen.has(day.date)) {
        seen.add(day.date);
        days.push(day);
      }
    }
    weekStart = getNextSunday(weekStart);
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  const { personId: rawPersonId } = await params;
  if (!isValidPersonId(rawPersonId)) {
    return new Response("Not found", { status: 404 });
  }

  const expectedToken = process.env.CALENDAR_FEED_TOKEN;
  const providedToken = req.nextUrl.searchParams.get("token");
  if (!expectedToken || providedToken !== expectedToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const days = await collectDays(rawPersonId);
  const dtstamp = toIcsUtc(new Date());
  const domain = "beta-lifeapp.vercel.app";

  const events: string[] = [];
  for (const day of days) {
    if (day.is_skate_day) {
      events.push(
        buildEvent({
          uid: `${rawPersonId}-${day.date}-skate@${domain}`,
          dtstamp,
          dtstart: localToUtcIcs(day.date, "07:00"),
          dtend: addMinutesIcs(day.date, "07:00", 60),
          summary: "🛹 Dia de skate",
        })
      );
    }
    for (const meal of day.meals) {
      events.push(
        buildEvent({
          uid: `${rawPersonId}-${day.date}-${meal.slot}@${domain}`,
          dtstamp,
          dtstart: localToUtcIcs(day.date, meal.scheduled_time),
          dtend: addMinutesIcs(day.date, meal.scheduled_time, 30),
          summary: SLOT_LABELS[meal.slot],
        })
      );
    }
  }

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Beta Life//Meal Plan Calendar//PT",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Beta Life",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="beta-life.ics"',
      "Cache-Control": "no-store",
    },
  });
}
