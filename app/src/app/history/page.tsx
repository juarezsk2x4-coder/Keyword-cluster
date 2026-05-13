import { getRecentMealLogs } from "@/lib/query";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import type { MealSlot, CardState } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await getRecentMealLogs(60);
  const lang = await getLang();
  const tr = t(lang);

  const byDate = logs.reduce<Record<string, typeof logs>>((acc, l) => {
    (acc[l.date] ||= []).push(l);
    return acc;
  }, {});

  if (logs.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">{tr.history_title(0)}</h1>
        <p className="text-sm text-muted">{tr.history_empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{tr.history_title(Object.keys(byDate).length)}</h1>

      {Object.entries(byDate).map(([date, dayLogs]) => {
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
              <div className="text-xs text-muted">{tr.history_kcal_protein(totalKcal, totalProt, dayLogs.length)}</div>
            </div>
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
          </div>
        );
      })}
    </div>
  );
}
