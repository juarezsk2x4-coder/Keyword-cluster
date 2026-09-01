import { resolveWeeklyPlan } from "@/lib/seed-plan";
import { getStoredWeeklyPlan } from "@/lib/query";
import { getLang } from "@/lib/lang";
import { getActivePerson } from "@/lib/person";
import { t } from "@/lib/i18n";
import { isAiEnabled } from "@/lib/nutrition-ai";
import PlanGenerator from "@/components/PlanGenerator";
import type { MealSlot, CardState } from "@/lib/types";
import { getSundayOfWeek, getNextSunday, todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function PlanPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = await getLang();
  const personId = await getActivePerson();
  const tr = t(lang);

  const thisWeekStart = getSundayOfWeek(todayIso());
  const nextWeekStart = getNextSunday(thisWeekStart);
  const selectedWeek = sp.week ?? nextWeekStart;

  const [resolved, stored] = await Promise.all([
    resolveWeeklyPlan(personId, selectedWeek),
    getStoredWeeklyPlan(personId, selectedWeek),
  ]);

  const aiEnabled = isAiEnabled();

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-1">{tr.plan_title}</h1>
        <p className="text-xs text-muted">
          {tr.plan_week_label} <span className="font-medium text-text">{selectedWeek}</span>
        </p>
        <div className="flex gap-2 mt-3 text-xs">
          <a
            href={`/plan?week=${thisWeekStart}`}
            className={`chip ${selectedWeek === thisWeekStart ? "bg-accent text-bg" : ""}`}
          >
            {tr.plan_this_week}
          </a>
          <a
            href={`/plan?week=${nextWeekStart}`}
            className={`chip ${selectedWeek === nextWeekStart ? "bg-accent text-bg" : ""}`}
          >
            {tr.plan_next_week}
          </a>
        </div>
        <div className="mt-3 text-xs text-muted">
          {tr.plan_source_label}{" "}
          <span className="font-medium text-text">
            {resolved.source === "ai" ? tr.plan_source_ai : tr.plan_source_seed}
          </span>
          {resolved.generated_at && (
            <span className="ml-2">({resolved.generated_at})</span>
          )}
        </div>
      </div>

      <PlanGenerator
        weekStart={selectedWeek}
        aiEnabled={aiEnabled}
        hasStoredAiPlan={stored?.source === "ai"}
        lang={lang}
      />

      <div className="space-y-3">
        {resolved.days.map((day) => (
          <div key={day.date} className="card">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-semibold">
                {day.day_of_week} · {day.date}
              </h2>
              <div className="text-xs text-muted">
                {day.is_skate_day && <span className="chip mr-1">{tr.skate_day}</span>}
                {day.kcal_target} kcal · {day.protein_g_target}g P
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {day.meals.map((card) => (
                <li key={card.slot} className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-muted">
                      {card.scheduled_time} · {tr.slots[card.slot as MealSlot]}:
                    </span>{" "}
                    <span className="text-text">
                      {card.alternatives.original.label}
                    </span>
                  </div>
                  <span className="chip text-xs shrink-0">
                    {card.alternatives.original.kcal} kcal
                  </span>
                </li>
              ))}
            </ul>
            <details className="mt-2">
              <summary className="text-xs text-muted cursor-pointer">
                {tr.plan_show_alternatives}
              </summary>
              <div className="mt-2 space-y-2 text-xs">
                {day.meals.map((card) => (
                  <div key={card.slot} className="border-l-2 border-border pl-2">
                    <div className="font-medium text-muted mb-1">
                      {tr.slots[card.slot as MealSlot]}
                    </div>
                    {(["easy", "liquid", "no_hunger"] as CardState[]).map((s) => (
                      <div key={s}>
                        <span className="text-muted">{tr.state[s]}:</span>{" "}
                        {card.alternatives[s].label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
