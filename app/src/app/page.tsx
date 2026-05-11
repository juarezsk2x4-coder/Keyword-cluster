import { buildWeeklyPlan } from "@/lib/seed-plan";
import { getTodayMealLogs, getTodaySleep, getFatigueToday, getPrepMinutesToday, getDailyTotals, getYesterdaySubstances } from "@/lib/query";
import MealCard from "@/components/MealCard";
import DayHeader from "@/components/DayHeader";
import type { CardState } from "@/lib/types";

export const dynamic = "force-dynamic";

function getWeekStart(): string {
  // Anchor to last Sunday (or today if Sunday)
  const today = new Date();
  const dow = today.getDay(); // 0 = Sunday
  today.setDate(today.getDate() - dow);
  return today.toISOString().slice(0, 10);
}

function defaultStateFor(opts: {
  isFatigued: boolean;
  prepMinutes: number | null;
  hadCocaineYesterday: boolean;
  sleepHours?: number;
  slot: string;
}): CardState {
  // Substance overlay takes precedence
  if (opts.hadCocaineYesterday) {
    // recovery defaults to original (which carries the recovery template), but allow liquid AM
    if (opts.slot === "cafe_da_manha" || opts.slot === "lanche_manha") return "liquid";
  }
  // Sleep overlay
  if (opts.sleepHours !== undefined) {
    if (opts.sleepHours < 5 && (opts.slot === "cafe_da_manha" || opts.slot === "lanche_manha")) return "liquid";
    if (opts.sleepHours >= 9 && (opts.slot === "cafe_da_manha" || opts.slot === "lanche_manha")) return "no_hunger";
  }
  // Fatigue overlay
  if (opts.isFatigued) return "easy";
  // Prep time overlay
  if (opts.prepMinutes !== null) {
    if (opts.prepMinutes <= 5) return "liquid";
    if (opts.prepMinutes <= 15) return "easy";
    if (opts.prepMinutes <= 30 && opts.slot !== "almoco") return "easy";
  }
  return "original";
}

export default async function TodayPage() {
  const weekStart = getWeekStart();
  const plan = buildWeeklyPlan(weekStart);
  const today = new Date().toISOString().slice(0, 10);
  const dayPlan = plan.find((d) => d.date === today) ?? plan[0];

  const [logs, sleep, fatigued, prepMin, totals, yestSubs] = await Promise.all([
    getTodayMealLogs(today),
    getTodaySleep(today),
    getFatigueToday(today),
    getPrepMinutesToday(today),
    getDailyTotals(today),
    getYesterdaySubstances(today),
  ]);
  const logsByslot = Object.fromEntries(logs.map((l) => [l.slot, l]));
  const hadCocaineYesterday = yestSubs.some((s) => s.substance === "cocaine");

  return (
    <div>
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
      />

      <div className="space-y-3">
        {dayPlan.meals.map((card) => {
          const logged = logsByslot[card.slot];
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
              date={today}
              loggedState={logged?.selected_state as CardState | undefined}
              defaultState={defaultState}
            />
          );
        })}
      </div>
    </div>
  );
}
