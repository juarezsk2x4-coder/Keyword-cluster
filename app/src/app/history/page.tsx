import { getMealLogsForPast, getExerciseLogsForPast, getSupplementLogsForPast } from "@/lib/query";
import { getLang } from "@/lib/lang";
import { getActivePerson } from "@/lib/person";
import { loadProfile } from "@/lib/profile";
import { t } from "@/lib/i18n";
import { todayIso } from "@/lib/dates";
import { estimateExerciseKcal } from "@/lib/exercise";
import type { MealSlot, CardState } from "@/lib/types";

export const dynamic = "force-dynamic";

const HISTORY_WINDOW_DAYS = 14;

export default async function HistoryPage() {
  const personId = await getActivePerson();
  const profile = loadProfile(personId);
  // Day-range query rather than a row LIMIT — a row cutoff can slice a day's
  // logs in half with no indication it's incomplete (e.g. showing 2 of 6
  // meals for the oldest visible date with a misleadingly-low kcal total).
  const [logs, exerciseLogs, supplementLogs] = await Promise.all([
    getMealLogsForPast(personId, todayIso(), HISTORY_WINDOW_DAYS),
    getExerciseLogsForPast(personId, todayIso(), HISTORY_WINDOW_DAYS),
    getSupplementLogsForPast(personId, todayIso(), HISTORY_WINDOW_DAYS),
  ]);
  const lang = await getLang();
  const tr = t(lang);
  const durationVariableExercises = profile.duration_variable_exercises ?? [];

  const mealsByDate = logs.reduce<Record<string, typeof logs>>((acc, l) => {
    (acc[l.date] ||= []).push(l);
    return acc;
  }, {});
  const exerciseByDate = exerciseLogs.reduce<Record<string, typeof exerciseLogs>>((acc, l) => {
    (acc[l.date] ||= []).push(l);
    return acc;
  }, {});
  const supplementsByDate = supplementLogs.reduce<Record<string, typeof supplementLogs>>((acc, l) => {
    (acc[l.date] ||= []).push(l);
    return acc;
  }, {});
  // Union of every date with ANY logged data — a day with only exercise or
  // supplements logged (no meals) used to have no card at all here, even
  // though it's visible on the home page the day it happened.
  const allDates = Array.from(
    new Set([...Object.keys(mealsByDate), ...Object.keys(exerciseByDate), ...Object.keys(supplementsByDate)])
  ).sort((a, b) => (a < b ? 1 : -1));

  if (allDates.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">{tr.history_title(0)}</h1>
        <p className="text-sm text-muted">{tr.history_empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{tr.history_title(allDates.length)}</h1>

      {allDates.map((date) => {
        const dayLogs = mealsByDate[date] ?? [];
        const dayExercise = exerciseByDate[date] ?? [];
        const daySupplements = supplementsByDate[date] ?? [];
        const totalKcal = dayLogs.reduce((s, l) => s + (l.kcal ?? 0), 0);
        const totalProt = dayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
        const stateCount = dayLogs.reduce<Record<string, number>>((acc, l) => {
          acc[l.selected_state] = (acc[l.selected_state] ?? 0) + 1;
          return acc;
        }, {});

        return (
          <div key={date} className="card">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-semibold">{date}</h2>
              {dayLogs.length > 0 && (
                <div className="text-xs text-muted">{tr.history_kcal_protein(totalKcal, totalProt, dayLogs.length)}</div>
              )}
            </div>

            {dayLogs.length > 0 && (
              <>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {Object.entries(stateCount).map(([s, n]) => (
                    <span key={s} className="chip">{tr.state[s as CardState]}: {n}</span>
                  ))}
                </div>
                <ul className="space-y-1 text-sm">
                  {dayLogs.map((l) => (
                    <li key={l.id} className="flex justify-between">
                      <div>
                        <span className="text-muted">{tr.slots[l.slot as MealSlot]}:</span> {l.actual_label}
                      </div>
                      <span className="chip text-xs ml-2">{tr.state[l.selected_state as CardState]}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {dayExercise.length > 0 && (
              <div className={dayLogs.length > 0 ? "mt-3" : ""}>
                <div className="label text-xs mb-1.5">{tr.history_exercises_title}</div>
                <ul className="space-y-1 text-sm">
                  {dayExercise.map((l) => {
                    const kcal = estimateExerciseKcal(l, profile.exercise_kcal_estimates, durationVariableExercises);
                    const label = l.custom_label || l.exercise_type;
                    return (
                      <li key={l.id} className="flex justify-between">
                        <div>
                          {label}
                          {l.duration_minutes ? ` · ${l.duration_minutes}min` : ""}
                        </div>
                        {kcal > 0 && <span className="text-muted tabular-nums">{Math.round(kcal)} kcal</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {daySupplements.length > 0 && (
              <div className={dayLogs.length > 0 || dayExercise.length > 0 ? "mt-3" : ""}>
                <div className="label text-xs mb-1.5">{tr.history_supplements_title}</div>
                <div className="flex gap-1.5 flex-wrap">
                  {daySupplements.map((l) => (
                    <span key={l.id} className="chip text-xs">{l.supplement_name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
