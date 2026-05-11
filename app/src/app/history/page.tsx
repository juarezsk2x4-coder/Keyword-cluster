import { getRecentMealLogs } from "@/lib/query";
import { SLOT_LABELS, STATE_LABELS } from "@/lib/types";
import type { MealSlot, CardState } from "@/lib/types";

export default function HistoryPage() {
  const logs = getRecentMealLogs(60);

  // group by date
  const byDate = logs.reduce<Record<string, typeof logs>>((acc, l) => {
    (acc[l.date] ||= []).push(l);
    return acc;
  }, {});

  if (logs.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Histórico</h1>
        <p className="text-sm text-muted">Nada logado ainda. Comece marcando refeições em <strong>Hoje</strong>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Histórico (últimos {Object.keys(byDate).length} dias)</h1>

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
              <div className="text-xs text-muted">
                {totalKcal} kcal · {Math.round(totalProt)}g proteína · {dayLogs.length} refeições
              </div>
            </div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {Object.entries(stateCount).map(([s, n]) => (
                <span key={s} className="chip">{STATE_LABELS[s as CardState]}: {n}</span>
              ))}
            </div>
            <ul className="space-y-1 text-sm">
              {dayLogs.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <div>
                    <span className="text-muted">{SLOT_LABELS[l.slot as MealSlot]}:</span> {l.actual_label}
                  </div>
                  <span className="chip text-xs ml-2">{STATE_LABELS[l.selected_state as CardState]}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
