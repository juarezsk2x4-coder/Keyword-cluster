import { resolveWeeklyPlan } from "@/lib/seed-plan";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import PlanGenerator from "@/components/PlanGenerator";
import { isAiEnabled } from "@/lib/meal-plan-ai";

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

function shiftDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function PlanPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const lang = await getLang();
  const tr = t(lang);
  const aiOn = isAiEnabled();

  const today = todayIso();
  const thisSunday = getSundayOfWeek(today);
  const weekStart = sp.week ?? thisSunday;
  const resolved = await resolveWeeklyPlan(weekStart);

  const prevWeek = shiftDays(weekStart, -7);
  const nextWeek = shiftDays(weekStart, 7);

  let sourceLabel = tr.plan_source_fallback;
  if (resolved.source === "ai" && resolved.generated_at) {
    const when = new Date(resolved.generated_at).toLocaleString(lang === "en" ? "en-US" : "pt-BR");
    sourceLabel = tr.plan_source_ai(when);
  } else if (resolved.source === "seed") {
    sourceLabel = tr.plan_source_seed;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">{tr.plan_title}</h1>
        <p className="text-xs text-muted mt-1">{tr.plan_intro}</p>
      </header>

      <div className="card flex flex-wrap items-center gap-2">
        <a
          href={`/plan?week=${prevWeek}`}
          className="text-xs px-2 py-1 rounded bg-surface hover:opacity-90 border border-border"
        >
          {tr.plan_prev_week_button}
        </a>
        <a
          href={`/plan?week=${thisSunday}`}
          className="text-xs px-2 py-1 rounded bg-surface hover:opacity-90 border border-border"
        >
          {tr.plan_this_week_button}
        </a>
        <a
          href={`/plan?week=${nextWeek}`}
          className="text-xs px-2 py-1 rounded bg-surface hover:opacity-90 border border-border"
        >
          {tr.plan_next_week_button}
        </a>
        <span className="ml-auto text-xs text-muted">{tr.plan_week_starting(weekStart)}</span>
      </div>

      <div className="card">
        <div className="text-xs text-muted">{sourceLabel}</div>
        <div className="mt-3">
          <PlanGenerator
            weekStart={weekStart}
            lang={lang}
            aiEnabled={aiOn}
            hasStored={resolved.source !== "fallback"}
          />
        </div>
      </div>

      <div className="space-y-3">
        {resolved.plan.map((day) => {
          const totalKcal = day.meals.reduce(
            (a, m) => a + (m.alternatives.original.kcal ?? 0),
            0
          );
          const totalProtein = Math.round(
            day.meals.reduce((a, m) => a + (m.alternatives.original.protein_g ?? 0), 0)
          );
          return (
            <div key={day.date} className="card">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-semibold">{day.day_of_week}</div>
                  <div className="text-xs text-muted">{day.date}</div>
                </div>
                <div className="text-xs text-muted">
                  {day.is_skate_day && <span className="mr-2">🛹</span>}
                  {tr.plan_day_summary(totalKcal, totalProtein, day.meals.length)}
                </div>
              </div>
              <ul className="mt-2 space-y-1.5">
                {day.meals.map((m) => (
                  <li key={m.slot} className="text-xs">
                    <span className="text-muted mr-1">{m.scheduled_time}</span>
                    <span className="font-medium">{tr.slots[m.slot]}:</span>{" "}
                    <span>{m.alternatives.original.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
