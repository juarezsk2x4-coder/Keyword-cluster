"use client";

import { useMemo, useState, useTransition } from "react";
import type { CardState, MealCard as MealCardType, MealLog } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { logMeal, deleteMealLog, estimateNutritionAction } from "@/app/actions";

const ORDER: CardState[] = ["original", "easy", "liquid", "no_hunger"];

interface Props {
  card: MealCardType;
  date: string;
  log?: MealLog;
  defaultState?: CardState;
  lang: Lang;
}

export default function MealCard({ card, date, log, defaultState, lang }: Props) {
  const tr = t(lang);
  const loggedState = (log?.selected_state as CardState | undefined) ?? null;
  const initial = loggedState ?? defaultState ?? "original";
  const [state, setState] = useState<CardState>(initial);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  // edit form state
  const [customLabel, setCustomLabel] = useState(log?.actual_label ?? "");
  const [customKcal, setCustomKcal] = useState<string>(log?.kcal != null ? String(log.kcal) : "");
  const [customProtein, setCustomProtein] = useState<string>(log?.protein_g != null ? String(log.protein_g) : "");
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAiTransition] = useTransition();

  const version = useMemo(() => card.alternatives[state], [card, state]);
  const isLogged = !!loggedState;
  const wasCustom = isLogged && log?.actual_label && log.actual_label !== card.alternatives[loggedState!]?.label;

  const handleLog = () => {
    startTransition(async () => {
      await logMeal({
        date,
        slot: card.slot,
        selected_state: state,
        actual_label: version.label,
        kcal: version.kcal,
        protein_g: version.protein_g,
      });
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      await deleteMealLog(date, card.slot);
    });
  };

  const handleSaveCustom = () => {
    if (!customLabel.trim()) return;
    startTransition(async () => {
      await logMeal({
        date,
        slot: card.slot,
        selected_state: state,
        actual_label: customLabel.trim(),
        kcal: customKcal.trim() ? Number(customKcal) : undefined,
        protein_g: customProtein.trim() ? Number(customProtein) : undefined,
      });
      setEditing(false);
      setAiNotes(null);
      setAiError(null);
    });
  };

  const handleEstimate = () => {
    if (!customLabel.trim()) return;
    setAiError(null);
    setAiNotes(null);
    startAiTransition(async () => {
      const result = await estimateNutritionAction(customLabel.trim(), lang);
      if (result.ok) {
        setCustomKcal(String(result.data.kcal));
        setCustomProtein(String(result.data.protein_g));
        setAiNotes(`${tr.ai_confidence[result.data.confidence]} · ${result.data.notes}`);
      } else {
        setAiError(result.error === "ai_disabled" ? tr.ai_not_configured : tr.ai_estimate_failed);
      }
    });
  };

  return (
    <div className={`card ${isLogged ? "border-accent/50" : ""}`}>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="label">{tr.slots[card.slot]}</div>
          <div className="text-muted text-xs">{card.scheduled_time}</div>
        </div>
        {isLogged && (
          <span className="chip chip-active">
            {tr.logged}: {wasCustom ? "✎" : tr.state[loggedState!]}
          </span>
        )}
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={`chip ${state === s ? "chip-active" : ""} active:scale-95 transition-transform`}
          >
            {tr.state[s]}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-text mb-1">
          {wasCustom ? log?.actual_label : version.label}
        </h3>
        <div className="text-xs text-muted flex gap-3 flex-wrap">
          <span>{wasCustom ? (log?.kcal ?? "?") : version.kcal} {tr.kcal.toLowerCase()}</span>
          <span>P: {wasCustom ? (log?.protein_g ?? "?") : version.protein_g}g</span>
          {!wasCustom && (
            <>
              <span>{tr.carbs}: {version.carbs_g}g</span>
              <span>{tr.fat}: {version.fat_g}g</span>
              <span>{version.prep_minutes}{tr.min_prep}</span>
            </>
          )}
        </div>
        {!wasCustom && version.notes && <p className="text-xs text-muted mt-2 italic">{version.notes}</p>}
      </div>

      {!editing && !wasCustom && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted hover:text-text mb-3 block"
        >
          {expanded ? tr.hide_ingredients : tr.show_ingredients(version.ingredients.length)}
        </button>
      )}

      {expanded && !editing && version.ingredients.length > 0 && (
        <ul className="text-xs text-muted space-y-0.5 mb-3 list-disc list-inside">
          {version.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
      )}

      {expanded && !editing && version.prep_steps && version.prep_steps.length > 0 && (
        <ol className="text-xs text-muted space-y-1 mb-3 list-decimal list-inside">
          {version.prep_steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      )}

      {editing && (
        <div className="space-y-2 mb-3 p-3 bg-bg rounded-xl border border-border">
          <p className="text-xs text-muted">{tr.custom_hint}</p>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder={tr.custom_label}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleEstimate}
            disabled={aiPending || !customLabel.trim()}
            className="btn btn-ghost text-xs w-full disabled:opacity-50 active:scale-95 transition-transform"
          >
            {aiPending ? `🤖 ${tr.estimating}` : `🤖 ${tr.estimate_with_ai}`}
          </button>
          {aiError && <p className="text-xs text-danger">{aiError}</p>}
          {aiNotes && <p className="text-xs text-accent italic">{aiNotes}</p>}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={customKcal}
              onChange={(e) => setCustomKcal(e.target.value)}
              placeholder={tr.custom_kcal}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={customProtein}
              onChange={(e) => setCustomProtein(e.target.value)}
              placeholder={tr.custom_protein}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveCustom}
              disabled={pending || !customLabel.trim()}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {pending ? tr.saving : tr.save}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setAiNotes(null); setAiError(null); }}
              disabled={pending}
              className="btn btn-ghost"
            >
              {tr.cancel}
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="flex gap-2 flex-wrap">
          {!isLogged ? (
            <>
              <button
                type="button"
                onClick={handleLog}
                disabled={pending}
                className="btn btn-primary flex-1 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {pending ? tr.logging : tr.ate_this}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={pending}
                className="btn btn-ghost text-xs"
              >
                {tr.edit_or_other}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleLog}
                disabled={pending}
                className="btn btn-ghost flex-1 disabled:opacity-50"
              >
                {pending ? tr.updating : `${tr.update_version} (${tr.state[state]})`}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={pending}
                className="btn btn-ghost text-xs"
              >
                {tr.edit_or_other}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={pending}
                className="btn btn-ghost text-danger disabled:opacity-50"
              >
                {tr.undo}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
