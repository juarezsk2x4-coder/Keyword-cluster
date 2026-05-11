"use client";

import { useTransition } from "react";
import { logSleep, logFatigue, clearFatigue, logPrepTime, logSubstance } from "@/app/actions";

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
}

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
            {props.hadCocaineYesterday && <span className="chip" style={{ background: "#e87b6b", color: "#0b0d0f", borderColor: "#e87b6b" }}>Recovery overlay ativo</span>}
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
                onClick={() => startTransition(() => { logSleep(h); })}
                disabled={pending}
                className={`chip ${props.sleepHours === h ? "chip-active" : ""}`}
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
                onClick={() => startTransition(() => { logPrepTime(m); })}
                disabled={pending}
                className={`chip ${props.prepMinutes === m ? "chip-active" : ""}`}
              >
                {m === 5 ? "≤5min" : m === 15 ? "15min" : m === 30 ? "30min" : "60min+"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="label">Cansaço de casa hoje</div>
          {props.isFatigued ? (
            <button onClick={() => startTransition(() => { clearFatigue(); })} className="btn btn-ghost text-xs">
              Limpar
            </button>
          ) : (
            <button onClick={() => startTransition(() => { logFatigue(); })} className="btn btn-warn text-xs">
              Tô cansado da casa hoje
            </button>
          )}
        </div>
        {props.isFatigued && (
          <p className="text-xs text-muted">
            Defaults dos cards setados pra <strong>Fácil</strong>. Delivery aceitável: poke / sushi / peruano / japonês. Nada de burger.
          </p>
        )}
      </div>

      <div className="card">
        <div className="label mb-2">Log de substância (toque pra adicionar)</div>
        <div className="flex flex-wrap gap-1.5">
          {(["cocaine", "alcohol", "cannabis", "tobacco", "benzo"] as const).map((s) => (
            <button
              key={s}
              onClick={() => startTransition(() => { logSubstance({ substance: s }); })}
              disabled={pending}
              className="chip hover:bg-surface"
            >
              + {s === "cocaine" ? "coca" : s === "alcohol" ? "álcool" : s === "cannabis" ? "cannabis" : s === "tobacco" ? "tabaco" : "benzo"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
