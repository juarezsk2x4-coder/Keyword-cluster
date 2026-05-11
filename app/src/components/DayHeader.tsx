"use client";

import { useTransition } from "react";
import { logSleep, logFatigue, clearFatigue, logPrepTime, logSubstance, deleteSubstanceLog } from "@/app/actions";
import type { SubstanceLog } from "@/lib/types";

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
}

const SUBSTANCE_LABELS: Record<string, string> = {
  cocaine: "coca",
  alcohol: "álcool",
  cannabis: "cannabis",
  tobacco: "tabaco",
  benzo: "benzo",
  psychedelic: "psicodélico",
  ketamine: "ketamina",
};

export default function DayHeader(props: Props) {
  const [pending, startTransition] = useTransition();

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
            {props.isSkateDay && <span className="chip chip-active">Skate day</span>}
            {props.hadCocaineYesterday && <span className="chip" style={{ background: "#e87b6b", color: "#0b0d0f", borderColor: "#e87b6b" }}>Recovery</span>}
            {props.isFatigued && <span className="chip" style={{ background: "#e8b06b", color: "#0b0d0f", borderColor: "#e8b06b" }}>Cansaço de casa</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between mb-1"><span className="label">Kcal</span><span className="text-muted">{props.kcalLogged} / {props.kcalTarget}</span></div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${kcalPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1"><span className="label">Proteína</span><span className="text-muted">{Math.round(props.proteinLogged)} / {props.proteinTarget} g</span></div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${protPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="label mb-2">Sono ao acordar</div>
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
          <div className="label mb-2">Tempo de prep hoje</div>
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
          <div className="label">Cansaço de casa</div>
          {props.isFatigued ? (
            <button
              type="button"
              onClick={() => startTransition(async () => { await clearFatigue(props.date); })}
              disabled={pending}
              className="btn btn-ghost text-xs"
            >
              Limpar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startTransition(async () => { await logFatigue(props.date); })}
              disabled={pending}
              className="btn btn-warn text-xs"
            >
              Tô cansado da casa
            </button>
          )}
        </div>
        {props.isFatigued && (
          <p className="text-xs text-muted">
            Defaults dos cards setados pra <strong>Fácil</strong>. Delivery aceitável: poke / sushi / peruano / japonês.
          </p>
        )}
      </div>

      <div className="card">
        <div className="label mb-2">Log de substância</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(["cocaine", "alcohol", "cannabis", "tobacco", "benzo"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => startTransition(async () => { await logSubstance({ substance: s, date: props.date }); })}
              disabled={pending}
              className="chip active:scale-95 transition-transform"
            >
              + {SUBSTANCE_LABELS[s]}
            </button>
          ))}
        </div>
        {props.substanceLogs.length > 0 && (
          <>
            <div className="label text-xs mb-1.5">Logado neste dia ({props.substanceLogs.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {props.substanceLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => startTransition(async () => { if (log.id) await deleteSubstanceLog(log.id); })}
                  disabled={pending}
                  className="chip chip-active text-xs"
                  title="Toque pra remover"
                >
                  {SUBSTANCE_LABELS[log.substance] ?? log.substance} ×
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
