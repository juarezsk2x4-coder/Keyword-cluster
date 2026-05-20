import { getHabitRollup, type HabitWindow, type HabitInsight } from "@/lib/habits";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import type { CardState } from "@/lib/types";

export const dynamic = "force-dynamic";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  searchParams: Promise<{ window?: string }>;
}

function severityStyle(s: "info" | "warning" | "alert"): { bg: string; border: string; color: string } {
  if (s === "alert") return { bg: "#3a1d1a", border: "#e87b6b", color: "#e87b6b" };
  if (s === "warning") return { bg: "#3a2d18", border: "#e8b06b", color: "#e8b06b" };
  return { bg: "#1a2820", border: "#7cc4a4", color: "#7cc4a4" };
}

export default async function AnalystPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = await getLang();
  const tr = t(lang);

  const requested = Number(sp.window ?? "7");
  const windowDays: HabitWindow = (requested === 14 || requested === 30 ? requested : 7) as HabitWindow;

  const today = todayIso();
  const rollup = await getHabitRollup(today, windowDays);
  const stateLabels = tr.state;
  const dowShort = [
    tr.analyst_dow_short.sun,
    tr.analyst_dow_short.mon,
    tr.analyst_dow_short.tue,
    tr.analyst_dow_short.wed,
    tr.analyst_dow_short.thu,
    tr.analyst_dow_short.fri,
    tr.analyst_dow_short.sat,
  ];

  const insightText = (ins: HabitInsight): string => {
    switch (ins.key) {
      case "chronic_protein_deficit":
        return tr.habit_insight.chronic_protein_deficit(
          Number(ins.payload?.avg ?? 0),
          Number(ins.payload?.target ?? 0)
        );
      case "chronic_kcal_deficit":
        return tr.habit_insight.chronic_kcal_deficit(
          Number(ins.payload?.avg ?? 0),
          Number(ins.payload?.target ?? 0)
        );
      case "most_missed_slot":
        return tr.habit_insight.most_missed_slot(
          tr.slots[String(ins.payload?.slot ?? "") as keyof typeof tr.slots] ?? String(ins.payload?.slot ?? ""),
          Number(ins.payload?.count ?? 0)
        );
      case "weekend_heavier":
        return tr.habit_insight.weekend_heavier(Number(ins.payload?.delta ?? 0));
      case "workday_lighter":
        return tr.habit_insight.workday_lighter(Number(ins.payload?.delta ?? 0));
      case "sleep_short_pattern":
        return tr.habit_insight.sleep_short_pattern(Number(ins.payload?.count ?? 0));
      case "on_track":
        return tr.habit_insight.on_track;
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">{tr.analyst_title}</h1>
        <p className="text-xs text-muted mt-1">{tr.analyst_intro}</p>
      </header>

      <div className="card flex gap-2 items-center">
        {[7, 14, 30].map((w) => (
          <a
            key={w}
            href={`/analyst?window=${w}`}
            className={`text-xs px-3 py-1 rounded-full border ${
              w === windowDays
                ? "bg-accent text-bg border-accent"
                : "border-border text-muted"
            }`}
          >
            {w === 7 ? tr.analyst_window_7 : w === 14 ? tr.analyst_window_14 : tr.analyst_window_30}
          </a>
        ))}
        <span className="ml-auto text-xs text-muted">
          {tr.analyst_days_with_data(rollup.days_with_data, windowDays)}
        </span>
      </div>

      {rollup.days_with_data < 3 ? (
        <div className="card">
          <p className="text-sm text-muted">{tr.analyst_no_data}</p>
        </div>
      ) : (
        <>
          {rollup.insights.length > 0 && (
            <div className="card">
              <div className="label mb-2">{tr.analyst_section_insights}</div>
              <div className="space-y-1.5">
                {rollup.insights.map((ins, i) => {
                  const c = severityStyle(ins.severity);
                  return (
                    <div
                      key={i}
                      className="text-xs rounded-lg p-2 border"
                      style={{ background: c.bg, borderColor: c.border, color: c.color }}
                    >
                      {insightText(ins)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <div className="label mb-2">{tr.analyst_section_macros_by_dow}</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="text-left font-normal">{lang === "en" ? "Day" : "Dia"}</th>
                  <th className="text-right font-normal">{tr.kcal}</th>
                  <th className="text-right font-normal">{tr.protein}</th>
                </tr>
              </thead>
              <tbody>
                {dowShort.map((name, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1">{name}</td>
                    <td className="text-right py-1">{rollup.avg_kcal_by_dow[i] || "—"}</td>
                    <td className="text-right py-1">{rollup.avg_protein_by_dow[i] || "—"}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rollup.missed_slots_top.length > 0 && (
            <div className="card">
              <div className="label mb-2">{tr.analyst_section_missed_slots}</div>
              <ul className="text-xs space-y-1">
                {rollup.missed_slots_top.map((m) => (
                  <li key={m.slot} className="flex justify-between">
                    <span>{tr.slots[m.slot]}</span>
                    <span className="text-muted">×{m.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="label mb-2">{tr.analyst_section_state_distribution}</div>
            <ul className="text-xs space-y-1">
              {(Object.keys(rollup.state_distribution) as CardState[]).map((s) => (
                <li key={s} className="flex justify-between">
                  <span>{stateLabels[s]}</span>
                  <span className="text-muted">{rollup.state_distribution[s]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="label mb-2">{tr.analyst_section_correlations}</div>
            <ul className="text-xs space-y-1 text-muted">
              {rollup.avg_kcal_short_sleep !== null && rollup.avg_kcal_normal_sleep !== null && (
                <li>
                  {tr.analyst_correlation_sleep(rollup.avg_kcal_short_sleep, rollup.avg_kcal_normal_sleep)}
                </li>
              )}
              {rollup.avg_kcal_post_substance !== null && (
                <li>{tr.analyst_correlation_substance(rollup.avg_kcal_post_substance)}</li>
              )}
              <li>{tr.analyst_max_easy_streak(rollup.max_easy_streak)}</li>
              <li>{tr.analyst_fatigue_days(rollup.fatigue_days)}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
