"use client";

import { useState, useTransition } from "react";
import { logBeverage, deleteBeverageLog } from "@/app/actions";
import type { BeverageLog, BeverageType } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  date: string;
  beverages: BeverageLog[];
  lang: Lang;
}

const TYPES: BeverageType[] = ["mate", "coffee", "tea", "treat"];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(dateIso: string, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(dateIso + "T00:00:00");
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

export default function BeveragePanel({ date, beverages, lang }: Props) {
  const tr = t(lang);
  const [pending, startTransition] = useTransition();
  const [openType, setOpenType] = useState<BeverageType | null>(null);
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState(nowHHMM());

  const lastByType: Partial<Record<BeverageType, BeverageLog>> = {};
  for (const b of beverages) {
    if (!lastByType[b.type]) lastByType[b.type] = b;
  }

  const handleSave = () => {
    if (!openType) return;
    startTransition(async () => {
      await logBeverage({
        date,
        type: openType,
        amount: amount.trim() || undefined,
        consumed_at: combineDateTime(date, time),
      });
      setOpenType(null);
      setAmount("");
      setTime(nowHHMM());
    });
  };

  return (
    <div className="card">
      <div className="label mb-2">{tr.beverages}</div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted">{tr.last_mate}:</span>
          <span className={lastByType.mate ? "text-text" : "text-muted"}>
            {lastByType.mate ? formatHHMM(lastByType.mate.consumed_at) : tr.none_yet}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{tr.last_coffee}:</span>
          <span className={lastByType.coffee ? "text-text" : "text-muted"}>
            {lastByType.coffee ? formatHHMM(lastByType.coffee.consumed_at) : tr.none_yet}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {TYPES.map((tt) => (
          <button
            key={tt}
            type="button"
            onClick={() => {
              setOpenType(openType === tt ? null : tt);
              setAmount("");
              setTime(nowHHMM());
            }}
            disabled={pending}
            className={`chip ${openType === tt ? "chip-active" : ""} active:scale-95 transition-transform`}
          >
            + {tr.beverage[tt]}
          </button>
        ))}
      </div>

      {openType && (
        <div className="space-y-2 p-3 bg-bg rounded-xl border border-border mb-2">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={tr.amount_placeholder(openType)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted whitespace-nowrap">{tr.consumed_at_label}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="btn btn-primary disabled:opacity-50 ml-auto"
            >
              {pending ? tr.saving : tr.add}
            </button>
          </div>
        </div>
      )}

      {beverages.length > 0 && (
        <>
          <div className="label text-xs mb-1.5">{tr.logged_today} ({beverages.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {beverages.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => startTransition(async () => { if (b.id) await deleteBeverageLog(b.id); })}
                disabled={pending}
                className="chip chip-active text-xs"
                title={tr.tap_to_remove}
              >
                {tr.beverage[b.type]} {b.amount ? `${b.amount} · ` : ""}{formatHHMM(b.consumed_at)} ×
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
