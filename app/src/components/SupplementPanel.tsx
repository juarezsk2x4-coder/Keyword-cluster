"use client";

import { useTransition } from "react";
import { logSupplement, deleteSupplementLog } from "@/app/actions";
import type { SupplementLog } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  date: string;
  supplements: string[];
  logs: SupplementLog[];
  lang: Lang;
}

export default function SupplementPanel({ date, supplements, logs, lang }: Props) {
  const tr = t(lang);
  const [pending, startTransition] = useTransition();
  const takenNames = new Set(logs.map((l) => l.supplement_name));

  if (supplements.length === 0) return null;

  return (
    <div className="card h-full">
      <div className="label mb-2">{tr.supplements_title}</div>
      <div className="flex flex-wrap gap-1.5">
        {supplements.map((name) => {
          const taken = takenNames.has(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() =>
                startTransition(async () => {
                  if (taken) await deleteSupplementLog(name, date);
                  else await logSupplement(name, date);
                })
              }
              disabled={pending}
              title={tr.tap_to_mark_taken}
              className={`chip ${taken ? "chip-success" : ""} active:scale-95 transition-transform`}
            >
              {taken ? "✓ " : "+ "}
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
