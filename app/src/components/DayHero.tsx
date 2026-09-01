import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  date: string;
  dayName: string;
  isSkateDay: boolean;
  kcalTarget: number;
  kcalLogged: number;
  proteinTarget: number;
  proteinLogged: number;
  hadStimulantYesterday: boolean;
  isFatigued: boolean;
  lang: Lang;
}

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function DayHero(props: Props) {
  const tr = t(props.lang);

  const kcalProgress = props.kcalTarget > 0 ? Math.min(1, props.kcalLogged / props.kcalTarget) : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - kcalProgress);
  const protPct = props.proteinTarget > 0 ? Math.min(100, Math.round((props.proteinLogged / props.proteinTarget) * 100)) : 0;

  return (
    <div className="card mb-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{props.dayName}</h1>
          <div className="text-xs text-muted mt-1">{props.date}</div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {props.isSkateDay && <span className="chip chip-active">{tr.skate_day}</span>}
          {props.hadStimulantYesterday && <span className="chip bg-danger text-ink border-danger">{tr.recovery}</span>}
          {props.isFatigued && <span className="chip bg-warn text-ink border-warn">{tr.house_fatigue}</span>}
        </div>
      </div>

      <div className="flex items-center gap-5 mt-5">
        <div className="relative w-[108px] h-[108px] flex-none">
          <svg viewBox="0 0 108 108" className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="kcalRingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <circle cx="54" cy="54" r={RING_RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
            <circle
              cx="54"
              cy="54"
              r={RING_RADIUS}
              fill="none"
              stroke="url(#kcalRingGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-extrabold tabular-nums leading-none">{props.kcalLogged}</div>
            <div className="text-[10px] text-muted mt-1 uppercase tracking-wide">/ {props.kcalTarget} {tr.kcal.toLowerCase()}</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="label">{tr.protein}</span>
            <span className="text-muted tabular-nums">{Math.round(props.proteinLogged)} / {props.proteinTarget} g</span>
          </div>
          <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${protPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
