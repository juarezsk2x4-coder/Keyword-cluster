import Link from "next/link";
import { getHabitRollup } from "@/lib/habits";
import { getLang } from "@/lib/lang";
import { getActivePerson } from "@/lib/person";
import { loadProfile } from "@/lib/profile";
import { t } from "@/lib/i18n";
import { todayIso } from "@/lib/dates";
import type { MealSlot, CardState } from "@/lib/types";

export const dynamic = "force-dynamic";

function severityStyle(s: "info" | "warning" | "alert"): { bg: string; border: string; color: string } {
  if (s === "alert") return { bg: "var(--danger-bg)", border: "var(--danger)", color: "var(--danger)" };
  if (s === "warning") return { bg: "var(--warn-bg)", border: "var(--warn)", color: "var(--warn)" };
  return { bg: "var(--success-bg)", border: "var(--success)", color: "var(--success)" };
}

interface PageProps {
  searchParams: Promise<{ window?: string }>;
}

export default async function AnalystPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = await getLang();
  const personId = await getActivePerson();
  const profile = loadProfile(personId);
  const tr = t(lang);
  const windowDaysRaw = parseInt(sp.window ?? "7", 10);
  const windowDays: 7 | 14 | 30 =
    windowDaysRaw === 14 ? 14 : windowDaysRaw === 30 ? 30 : 7;

  const rollup = await getHabitRollup(
    personId,
    todayIso(),
    windowDays,
    {
      kcal: profile.nutrition_targets.total_kcal_target_off_day,
      protein: profile.nutrition_targets.protein_g_per_day,
    },
    {
      loggableExercises: profile.loggable_exercises,
      exerciseKcalEstimates: profile.exercise_kcal_estimates,
      durationVariableExercises: profile.duration_variable_exercises,
      dailySupplements: profile.daily_supplements,
    }
  );

  // Hoisted out of the chart row maps below — each was rebuilding and spreading
  // the whole array once per rendered row (up to 30 rows on the 30-day window).
  const dowMax = Math.max(...rollup.avg_kcal_per_dow, 1);
  const trendMax = Math.max(...rollup.exercise_kcal_trend.map((d) => d.kcal), 1);

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">{tr.analyst_title}</h1>
        <div className="flex gap-2 text-xs">
          <Link href="/analyst?window=7" aria-current={windowDays === 7 ? "page" : undefined} className={`chip ${windowDays === 7 ? "chip-active" : ""}`}>
            {tr.analyst_window_7}
          </Link>
          <Link href="/analyst?window=14" aria-current={windowDays === 14 ? "page" : undefined} className={`chip ${windowDays === 14 ? "chip-active" : ""}`}>
            {tr.analyst_window_14}
          </Link>
          <Link href="/analyst?window=30" aria-current={windowDays === 30 ? "page" : undefined} className={`chip ${windowDays === 30 ? "chip-active" : ""}`}>
            {tr.analyst_window_30}
          </Link>
        </div>
        <p className="text-xs text-muted mt-2">{tr.analyst_days_with_data(rollup.days_with_data)}</p>
      </div>

      {!rollup.has_any_data ? (
        <div className="card">
          <p className="text-sm text-muted">{tr.analyst_empty}</p>
        </div>
      ) : (
        <>
          <div className="card space-y-1">
            <p className="text-sm">{tr.analyst_avg_kcal(rollup.avg_kcal_per_day)}</p>
            <p className="text-sm">{tr.analyst_avg_protein(rollup.avg_protein_per_day)}</p>
            <p className="text-sm">{tr.analyst_easy_streak_max(rollup.easy_streak_max)}</p>
            <p className="text-sm">{tr.analyst_fatigue_days(rollup.fatigue_days)}</p>
            <p className="text-sm">{tr.analyst_substance_days(rollup.substance_days)}</p>
            {profile.loggable_exercises && profile.loggable_exercises.length > 0 && (
              <>
                <p className="text-sm">{tr.analyst_exercise_days(rollup.exercise_days)}</p>
                <p className="text-sm">{tr.analyst_exercise_streak(rollup.exercise_streak_max)}</p>
                {rollup.total_exercise_kcal > 0 && (
                  <p className="text-sm">{tr.analyst_exercise_kcal_total(rollup.total_exercise_kcal)}</p>
                )}
              </>
            )}
            {profile.daily_supplements && profile.daily_supplements.length > 0 && (
              <p className="text-sm">{tr.analyst_supplement_adherence(rollup.supplement_adherence_pct)}</p>
            )}
          </div>

          <div className="card">
            <div className="label mb-2">{tr.analyst_by_dow_title}</div>
            <div className="space-y-1.5">
              {rollup.avg_kcal_per_dow.map((kcal, i) => {
                const hasData = rollup.days_with_logs_per_dow[i] > 0;
                const pct = hasData ? Math.round((kcal / dowMax) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-8 text-muted">{tr.analyst_dow_names[i]}</div>
                    <div className="flex-1 h-3 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-muted tabular-nums">
                      {hasData ? `${kcal} kcal` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {profile.loggable_exercises && profile.loggable_exercises.length > 0 &&
            rollup.exercise_kcal_trend.some((d) => d.kcal > 0) && (
              <div className="card">
                <div className="label mb-2">{tr.analyst_exercise_trend_title}</div>
                <div className="space-y-1.5">
                  {rollup.exercise_kcal_trend.map((d) => {
                    const pct = Math.round((d.kcal / trendMax) * 100);
                    return (
                      <div key={d.date} className="flex items-center gap-2 text-xs">
                        <div className="w-14 text-muted">{d.date.slice(5)}</div>
                        <div className="flex-1 h-3 bg-bg rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-16 text-right text-muted tabular-nums">
                          {d.kcal > 0 ? `${d.kcal} kcal` : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {rollup.most_missed_slots.length > 0 && (
            <div className="card">
              <div className="label mb-2">{tr.analyst_most_missed_title}</div>
              <ul className="space-y-1 text-sm">
                {rollup.most_missed_slots.map((m) => (
                  <li key={m.slot} className="flex justify-between">
                    <span>{tr.slots[m.slot as MealSlot]}</span>
                    <span className="text-muted tabular-nums">{m.missed_pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="label mb-2">{tr.analyst_state_distribution_title}</div>
            <div className="flex gap-1.5 flex-wrap">
              {(["original", "easy", "liquid", "no_hunger"] as CardState[]).map((s) => (
                <span key={s} className="chip">
                  {tr.state[s]}: {rollup.state_distribution[s]}%
                </span>
              ))}
            </div>
          </div>

          {rollup.insights.length > 0 && (
            <div className="card">
              <div className="label mb-2">{tr.analyst_patterns_title}</div>
              <div className="space-y-1.5">
                {rollup.insights.map((ins, idx) => {
                  const c = severityStyle(ins.severity);
                  let text = "";
                  switch (ins.key) {
                    case "chronic_under_kcal":
                      text = tr.habit_insight.chronic_under_kcal(Number(ins.payload?.pct ?? 0));
                      break;
                    case "chronic_under_protein":
                      text = tr.habit_insight.chronic_under_protein(Number(ins.payload?.pct ?? 0));
                      break;
                    case "weekday_dip":
                      text = tr.habit_insight.weekday_dip(
                        tr.analyst_dow_names[Number(ins.payload?.dow_index ?? 0)]
                      );
                      break;
                    case "slot_chronically_missed":
                      text = tr.habit_insight.slot_chronically_missed(
                        tr.slots[(ins.payload?.slot as MealSlot) ?? "cafe_da_manha"],
                        Number(ins.payload?.pct ?? 0)
                      );
                      break;
                    case "easy_dominance":
                      text = tr.habit_insight.easy_dominance(Number(ins.payload?.pct ?? 0));
                      break;
                    case "substance_correlation":
                      text = tr.habit_insight.substance_correlation;
                      break;
                    case "fatigue_frequent":
                      text = tr.habit_insight.fatigue_frequent(Number(ins.payload?.days ?? 0));
                      break;
                    case "sleep_kcal_link":
                      text = tr.habit_insight.sleep_kcal_link;
                      break;
                    case "consider_professional_support":
                      text = tr.habit_insight.consider_professional_support;
                      break;
                    case "exercise_infrequent":
                      text = tr.habit_insight.exercise_infrequent(Number(ins.payload?.days ?? 0));
                      break;
                    case "supplement_adherence_low":
                      text = tr.habit_insight.supplement_adherence_low(Number(ins.payload?.pct ?? 0));
                      break;
                    case "on_track":
                      text = tr.habit_insight.on_track;
                      break;
                  }
                  return (
                    <div
                      key={idx}
                      className="text-xs rounded-lg p-2 border"
                      style={{ background: c.bg, borderColor: c.border, color: c.color }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
