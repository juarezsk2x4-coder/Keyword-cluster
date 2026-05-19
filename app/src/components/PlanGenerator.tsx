"use client";

import { useState, useTransition } from "react";
import { generateWeekPlanAction, deleteWeekPlanAction } from "@/app/actions";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  weekStart: string;
  aiEnabled: boolean;
  hasStoredAiPlan: boolean;
  lang: Lang;
}

export default function PlanGenerator({ weekStart, aiEnabled, hasStoredAiPlan, lang }: Props) {
  const tr = t(lang);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await generateWeekPlanAction(weekStart);
      if (res.ok) {
        setMessage(tr.plan_generate_success(res.days));
      } else {
        setError(res.error === "ai_disabled" ? tr.ai_not_configured : tr.plan_generate_failed);
      }
    });
  };

  const handleDelete = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await deleteWeekPlanAction(weekStart);
      if (res.ok) {
        setMessage(tr.plan_revert_success);
      } else {
        setError(tr.plan_revert_failed);
      }
    });
  };

  if (!aiEnabled) {
    return (
      <div className="card">
        <p className="text-xs text-muted">{tr.ai_not_configured}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="w-full px-4 py-2 rounded-lg bg-accent text-bg font-medium active:scale-95 transition-transform disabled:opacity-60"
      >
        {pending ? tr.plan_generating : tr.plan_generate_button}
      </button>
      {hasStoredAiPlan && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="w-full mt-2 px-4 py-2 rounded-lg border border-border text-xs text-muted active:scale-95 transition-transform disabled:opacity-60"
        >
          {tr.plan_revert_to_seed}
        </button>
      )}
      {message && <p className="text-xs text-accent mt-2">{message}</p>}
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
      <p className="text-xs text-muted mt-2">{tr.plan_generate_hint}</p>
    </div>
  );
}
