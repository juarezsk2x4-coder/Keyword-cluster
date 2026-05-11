"use client";

import { useTransition } from "react";
import { logSleep, logFatigue, clearFatigue, logPrepTime, logSubstance, deleteSubstanceLog } from "@/app/actions";
import type { SubstanceLog, BeverageLog } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import BeveragePanel from "./BeveragePanel";

interface Props {
  date: string;
  dayName: string;
  isSkateDay: boolean;
  kcalTarget: number;
  kcalLogged: number;
  proteinTarget: number;
  proteinLogged: number;
  sleepHours?: number;
  isFatigued: boolean;
  prepMinutes: number | null;
  hadCocaineYesterday: boolean;
  substanceLogs: SubstanceLog[];
  beverages: BeverageLog[];
  lang: Lang;
}

export default function DayHeader(props: Props) {
  const [pending, startTransition] = useTransition();
  const tr = t(props.lang);

  const kcalPct = Math.min(100, Math.round((props.kcalLogged / props.kcalTarget) * 100));
  const protPct = Math.min(100, Math.round((props.proteinLogged / props.proteinTarget) * 100));

  return (
    <div className="space-y-3 mb-6">
      <div className="card">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold">{props.dayName}</h1>
            <div className="text-xs text-muted">{props.date}</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {props.isSkateDay && <span className="chip chip-active">{tr.skate_day}</span>}
            {props.hadCocaineYesterday && <span className="chip" style={{ background: "#e87b6b", color: "#0b0d0f", borderColor: "#e87b6b" }}>{tr.recovery}</span>}
            {props.isFatigued && <span className="chip" style={{ background: "#e8b06b", color: "#0b0d0f", borderColor: "#e8b06b" }}>{tr.house_fatigue}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between mb-1"><span className="label">{tr.kcal}</span><span className="text-muted">{props.kcalLogged} / {props.kcalTarget}</span></div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${kcalPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1"><span className="label">{tr.protein}</span><span className="text-muted">{Math.round(props.proteinLogged)} / {props.proteinTarget} g</span></div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${protPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="label mb-2">{tr.sleep_on_wake}</div>
          <div className="flex flex-wrap gap-1.5">
            {[4, 5, 6, 7, 8, 9, 10].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => startTransition(async () => { await logSleep(h, props.date); })}
                disabled={pending}
                className={`chip ${props.sleepHours === h ? "chip-active" : ""} active:scale-95 transition-transform`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="label mb-2">{tr.prep_time_today}</div>
          <div className="flex flex-wrap gap-1.5">
            {[5, 15, 30, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => startTransition(async () => { await logPrepTime(m, props.date); })}
                disabled={pending}
                className={`chip ${props.prepMinutes === m ? "chip-active" : ""} active:scale-95 transition-transform`}
              >
                {m === 5 ? "≤5min" : m === 15 ? "15min" : m === 30 ? "30min" : "60min+"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="label">{tr.house_fatigue}</div>
          {props.isFatigued ? (
            <button
              type="button"
              onClick={() => startTransition(async () => { await clearFatigue(props.date); })}
              disabled={pending}
              className="btn btn-ghost text-xs"
            >
              {tr.clear}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startTransition(async () => { await logFatigue(props.date); })}
              disabled={pending}
              className="btn btn-warn text-xs"
            >
              {tr.house_fatigue_btn}
            </button>
          )}
        </div>
        {props.isFatigued && (
          <p className="text-xs text-muted">{tr.house_fatigue_active_note}</p>
        )}
      </div>

      <BeveragePanel date={props.date} beverages={props.beverages} lang={props.lang} />

      <div className="card">
        <div className="label mb-2">{tr.substance_log}</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(["cocaine", "alcohol", "cannabis", "tobacco", "benzo"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => startTransition(async () => { await logSubstance({ substance: s, date: props.date }); })}
              disabled={pending}
              className="chip active:scale-95 transition-transform"
            >
              + {tr.sub[s]}
            </button>
          ))}
        </div>
        {props.substanceLogs.length > 0 && (
          <>
            <div className="label text-xs mb-1.5">{tr.logged_today} ({props.substanceLogs.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {props.substanceLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => startTransition(async () => { if (log.id) await deleteSubstanceLog(log.id); })}
                  disabled={pending}
                  className="chip chip-active text-xs"
                  title={tr.tap_to_remove}
                >
                  {tr.sub[log.substance as keyof typeof tr.sub] ?? log.substance} ×
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
