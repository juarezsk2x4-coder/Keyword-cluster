"use client";

import { useState, useTransition } from "react";
import { logExercise, deleteExerciseLog } from "@/app/actions";
import type { ExerciseLog } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  date: string;
  exercises: string[];
  logs: ExerciseLog[];
  lang: Lang;
}

export default function ExercisePanel({ date, exercises, logs, lang }: Props) {
  const tr = t(lang);
  const [pending, startTransition] = useTransition();
  const [addingOther, setAddingOther] = useState(false);
  const [otherLabel, setOtherLabel] = useState("");

  const presetLog = (type: string) => logs.find((l) => l.exercise_type === type && !l.custom_label);
  const otherLogs = logs.filter((l) => l.exercise_type === "other" && l.custom_label);

  if (exercises.length === 0) return null;

  const handleSaveOther = () => {
    if (!otherLabel.trim()) return;
    startTransition(async () => {
      await logExercise("other", date, otherLabel.trim());
      setOtherLabel("");
      setAddingOther(false);
    });
  };

  return (
    <div className="card">
      <div className="label mb-2">{tr.exercise_log_title}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {exercises.map((name) => {
          const existing = presetLog(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() =>
                startTransition(async () => {
                  if (existing?.id) await deleteExerciseLog(existing.id);
                  else await logExercise(name, date);
                })
              }
              disabled={pending}
              className={`chip ${existing ? "chip-success" : ""} active:scale-95 transition-transform`}
            >
              {existing ? "✓ " : "+ "}
              {name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAddingOther(!addingOther)}
          disabled={pending}
          className={`chip ${addingOther ? "chip-active" : ""} active:scale-95 transition-transform`}
        >
          {tr.exercise_other_label}
        </button>
      </div>

      {addingOther && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={otherLabel}
            onChange={(e) => setOtherLabel(e.target.value)}
            placeholder={tr.exercise_other_placeholder}
            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleSaveOther}
            disabled={pending || !otherLabel.trim()}
            className="btn btn-primary text-xs disabled:opacity-50"
          >
            {pending ? tr.saving : tr.save}
          </button>
        </div>
      )}

      {otherLogs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {otherLogs.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => startTransition(async () => { if (log.id) await deleteExerciseLog(log.id); })}
              disabled={pending}
              className="chip chip-success text-xs"
              title={tr.tap_to_remove}
            >
              ✓ {log.custom_label} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
