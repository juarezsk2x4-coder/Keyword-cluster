import { resolveWeeklyPlan } from "@/lib/seed-plan";
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
import MealNotifications from "@/components/MealNotifications";
import PredictionBanner from "@/components/PredictionBanner";
import WeatherCard from "@/components/WeatherCard";
import { getPredictions } from "@/lib/predictions";
import { getTodayWeather } from "@/lib/weather";
import type { CardState } from "@/lib/types";
import { getLang } from "@/lib/lang";
import { getActivePerson } from "@/lib/person";
import { loadProfile } from "@/lib/profile";
import { getSundayOfWeek, todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

function defaultStateFor(opts: {
  isFatigued: boolean;
  prepMinutes: number | null;
  hadStimulantYesterday: boolean;
  sleepHours?: number;
  slot: string;
}): CardState {
  if (opts.hadStimulantYesterday) {
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
  const personId = await getActivePerson();
  const profile = loadProfile(personId);
  const selectedDate = sp.date ?? todayIso();
  const weekStart = getSundayOfWeek(selectedDate);
  const resolved = await resolveWeeklyPlan(personId, weekStart);
  const dayPlan = resolved.days.find((d) => d.date === selectedDate) ?? resolved.days[0];

  const [logs, sleep, fatigued, prepMin, totals, daySubs, prevDaySubs, beverages, predictions, weather] =
    await Promise.all([
      getDayMealLogs(personId, selectedDate),
      getDaySleep(personId, selectedDate),
      getDayFatigue(personId, selectedDate),
      getDayPrepMinutes(personId, selectedDate),
      getDayTotals(personId, selectedDate),
      getDaySubstances(personId, selectedDate),
      getPreviousDaySubstances(personId, selectedDate),
      getDayBeverages(personId, selectedDate),
      getPredictions(personId, selectedDate, dayPlan.is_skate_day, {
        kcalNormal: profile.nutrition_targets.total_kcal_target_off_day,
        kcalSkate: profile.nutrition_targets.total_kcal_target_skate_day,
        protein: profile.nutrition_targets.protein_g_per_day,
      }),
      getTodayWeather(profile),
    ]);
  const logsByslot = Object.fromEntries(logs.map((l) => [l.slot, l]));
  const hadStimulantYesterday = prevDaySubs.some((s) => s.substance === "stimulant");
  // The nudge only makes sense against real-time weather for today's own
  // plan — browsing a past/future date's card shouldn't imply the weather
  // shown (always "today's") applies to that other date's activity status.
  const isGoodSkateDay = selectedDate === todayIso() && weather?.condition === "clear" && dayPlan.is_skate_day;

  return (
    <div>
      <DateNavigator current={selectedDate} lang={lang} />

      <MealNotifications meals={dayPlan.meals} lang={lang} date={selectedDate} personId={personId} />

      <WeatherCard weather={weather} isGoodSkateDay={isGoodSkateDay} lang={lang} />

      <PredictionBanner prediction={predictions} lang={lang} />

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
        hadStimulantYesterday={hadStimulantYesterday}
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
            hadStimulantYesterday,
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
