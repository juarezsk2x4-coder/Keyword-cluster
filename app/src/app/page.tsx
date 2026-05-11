import { buildWeeklyPlan } from "@/lib/seed-plan";
import {
  getDayMealLogs,
  getDaySleep,
  getDayFatigue,
  getDayPrepMinutes,
  getDayTotals,
  getDaySubstances,
  getPreviousDaySubstances,
  getDayBeverages,
} from "@/lib/query";
import MealCard from "@/components/MealCard";
import DayHeader from "@/components/DayHeader";
import DateNavigator from "@/components/DateNavigator";
import type { CardState } from "@/lib/types";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";

function getSundayOfWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultStateFor(opts: {
  isFatigued: boolean;
  prepMinutes: number | null;
  hadCocaineYesterday: boolean;
  sleepHours?: number;
  slot: string;
}): CardState {
  if (opts.hadCocaineYesterday) {
    if (opts.slot === "cafe_da_manha" || opts.slot === "lanche_manha") return "liquid";
  }
  if (opts.sleepHours !== undefined) {
    if (opts.sleepHours < 5 && (opts.slot === "cafe_da_manha" || opts.slot === "lanche_manha")) return "liquid";
    if (opts.sleepHours >= 9 && (opts.slot === "cafe_da_manha" || opts.slot === "lanche_manha")) return "no_hunger";
  }
  if (opts.isFatigued) return "easy";
  if (opts.prepMinutes !== null) {
    if (opts.prepMinutes <= 5) return "liquid";
    if (opts.prepMinutes <= 15) return "easy";
    if (opts.prepMinutes <= 30 && opts.slot !== "almoco") return "easy";
  }
  return "original";
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TodayPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = await getLang();
  const selectedDate = sp.date ?? todayIso();
  const weekStart = getSundayOfWeek(selectedDate);
  const plan = buildWeeklyPlan(weekStart);
  const dayPlan = plan.find((d) => d.date === selectedDate) ?? plan[0];

  const [logs, sleep, fatigued, prepMin, totals, daySubs, prevDaySubs, beverages] = await Promise.all([
    getDayMealLogs(selectedDate),
    getDaySleep(selectedDate),
    getDayFatigue(selectedDate),
    getDayPrepMinutes(selectedDate),
    getDayTotals(selectedDate),
    getDaySubstances(selectedDate),
    getPreviousDaySubstances(selectedDate),
    getDayBeverages(selectedDate),
  ]);
  const logsByslot = Object.fromEntries(logs.map((l) => [l.slot, l]));
  const hadCocaineYesterday = prevDaySubs.some((s) => s.substance === "cocaine");

  return (
    <div>
      <DateNavigator current={selectedDate} lang={lang} />

      <DayHeader
        date={dayPlan.date}
        dayName={dayPlan.day_of_week}
        isSkateDay={dayPlan.is_skate_day}
        kcalTarget={dayPlan.kcal_target}
        kcalLogged={totals.kcal}
        proteinTarget={dayPlan.protein_g_target}
        proteinLogged={totals.protein_g}
        sleepHours={sleep?.hours}
        isFatigued={fatigued}
        prepMinutes={prepMin}
        hadCocaineYesterday={hadCocaineYesterday}
        substanceLogs={daySubs}
        beverages={beverages}
        lang={lang}
      />

      <div className="space-y-3">
        {dayPlan.meals.map((card) => {
          const log = logsByslot[card.slot];
          const defaultState = defaultStateFor({
            isFatigued: fatigued,
            prepMinutes: prepMin,
            hadCocaineYesterday,
            sleepHours: sleep?.hours,
            slot: card.slot,
          });
          return (
            <MealCard
              key={card.slot}
              card={card}
              date={selectedDate}
              log={log}
              defaultState={defaultState}
              lang={lang}
            />
          );
        })}
      </div>
    </div>
  );
}
