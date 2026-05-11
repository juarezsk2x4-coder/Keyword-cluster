"use client";

import { useMemo, useState, useTransition } from "react";
import type { CardState, MealCard as MealCardType } from "@/lib/types";
import { STATE_LABELS, SLOT_LABELS } from "@/lib/types";
import { logMeal, deleteMealLog } from "@/app/actions";

const ORDER: CardState[] = ["original", "easy", "liquid", "no_hunger"];

interface Props {
  card: MealCardType;
  date: string;
  loggedState?: CardState | null;
  defaultState?: CardState;
}

export default function MealCard({ card, date, loggedState, defaultState }: Props) {
  const initial = loggedState ?? defaultState ?? "original";
  const [state, setState] = useState<CardState>(initial);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const version = useMemo(() => card.alternatives[state], [card, state]);
  const isLogged = !!loggedState;

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

  return (
    <div className={`card ${isLogged ? "border-accent/50" : ""}`}>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="label">{SLOT_LABELS[card.slot]}</div>
          <div className="text-muted text-xs">{card.scheduled_time}</div>
        </div>
        {isLogged && <span className="chip chip-active">Logado: {STATE_LABELS[loggedState!]}</span>}
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`chip ${state === s ? "chip-active" : ""}`}
          >
            {STATE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-text mb-1">{version.label}</h3>
        <div className="text-xs text-muted flex gap-3 flex-wrap">
          <span>{version.kcal} kcal</span>
          <span>P: {version.protein_g}g</span>
          <span>C: {version.carbs_g}g</span>
          <span>G: {version.fat_g}g</span>
          <span>{version.prep_minutes}min prep</span>
        </div>
        {version.notes && <p className="text-xs text-muted mt-2 italic">{version.notes}</p>}
      </div>

      <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted hover:text-text mb-3">
        {expanded ? "Esconder ingredientes" : `Ver ${version.ingredients.length} ingrediente${version.ingredients.length === 1 ? "" : "s"}`}
      </button>

      {expanded && version.ingredients.length > 0 && (
        <ul className="text-xs text-muted space-y-0.5 mb-3 list-disc list-inside">
          {version.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
      )}

      {expanded && version.prep_steps && version.prep_steps.length > 0 && (
        <ol className="text-xs text-muted space-y-1 mb-3 list-decimal list-inside">
          {version.prep_steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      )}

      <div className="flex gap-2">
        {!isLogged ? (
          <button onClick={handleLog} disabled={pending} className="btn btn-primary flex-1 disabled:opacity-50">
            {pending ? "Logando…" : "Comi isso"}
          </button>
        ) : (
          <>
            <button onClick={handleLog} disabled={pending} className="btn btn-ghost flex-1">
              Atualizar versão ({STATE_LABELS[state]})
            </button>
            <button onClick={handleClear} disabled={pending} className="btn btn-ghost text-danger">
              Desfazer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
