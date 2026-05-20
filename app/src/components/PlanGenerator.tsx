"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateNextWeekPlanAction, deleteStoredWeeklyPlanAction } from "@/app/actions";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  weekStart: string;
  lang: Lang;
  aiEnabled: boolean;
  hasStored: boolean;
}

export default function PlanGenerator({ weekStart, lang, aiEnabled, hasStored }: Props) {
  const router = useRouter();
  const tr = t(lang);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!aiEnabled) {
    return (
      <p className="text-xs text-muted" style={{ color: "#e8b06b" }}>
        {tr.plan_ai_disabled}
      </p>
    );
  }

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateNextWeekPlanAction(weekStart, lang);
      if (!result.ok) {
        setError(tr.plan_generation_failed(result.error));
      } else {
        router.refresh();
      }
    });
  };

  const clearStored = () => {
    setError(null);
    startTransition(async () => {
      await deleteStoredWeeklyPlanAction(weekStart);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="text-xs px-3 py-2 rounded bg-accent text-bg font-medium active:scale-95 disabled:opacity-50"
        >
          {isPending
            ? tr.plan_generating
            : hasStored
              ? tr.plan_regenerate_button
              : tr.plan_generate_button}
        </button>
        {hasStored && (
          <button
            type="button"
            onClick={clearStored}
            disabled={isPending}
            className="text-xs px-3 py-2 rounded bg-surface border border-border active:scale-95 disabled:opacity-50"
          >
            {tr.plan_clear_button}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs" style={{ color: "#e87b6b" }}>
          {error}
        </p>
      )}
    </div>
  );
}
