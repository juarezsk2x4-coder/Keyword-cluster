import type { ExerciseLog } from "./types";

// Single source of truth for "how many kcal did this exercise log burn",
// shared by the home page's same-day ring bonus and the History/Analyst
// rollups below — duplicating this math in more than one place is exactly
// how the meal-plan-ai.ts carb-target drift bug happened.
export function estimateExerciseKcal(
  log: ExerciseLog,
  kcalEstimates: Record<string, number> | undefined,
  durationVariableExercises: string[]
): number {
  const estimate = kcalEstimates?.[log.exercise_type];
  if (estimate === undefined) return 0;
  if (durationVariableExercises.includes(log.exercise_type)) {
    // A per-minute rate times a real duration is rarely a whole number
    // (e.g. 7.22 * 60 = 433.2) — round here, the one shared place this
    // math happens, so it never leaks a decimal into a kcal display.
    return log.duration_minutes ? Math.round(estimate * log.duration_minutes) : 0;
  }
  return estimate;
}

export function sumExerciseKcal(
  logs: ExerciseLog[],
  kcalEstimates: Record<string, number> | undefined,
  durationVariableExercises: string[]
): number {
  return logs.reduce((sum, log) => sum + estimateExerciseKcal(log, kcalEstimates, durationVariableExercises), 0);
}
