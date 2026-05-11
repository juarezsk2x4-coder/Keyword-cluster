"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function labelFor(iso: string): string {
  const today = todayIso();
  const yest = shiftDate(today, -1);
  const tom = shiftDate(today, 1);
  if (iso === today) return "Hoje";
  if (iso === yest) return "Ontem";
  if (iso === tom) return "Amanhã";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function DateNavigator({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const today = useMemo(() => todayIso(), []);

  const navigate = (iso: string) => {
    const params = new URLSearchParams(sp.toString());
    if (iso === today) params.delete("date");
    else params.set("date", iso);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <button
        onClick={() => navigate(shiftDate(current, -1))}
        className="btn btn-ghost text-lg leading-none w-10 h-10 flex items-center justify-center"
        aria-label="Dia anterior"
      >
        ‹
      </button>
      <div className="flex-1 text-center">
        <div className="font-semibold capitalize">{labelFor(current)}</div>
        <div className="text-xs text-muted">{current}</div>
      </div>
      <button
        onClick={() => navigate(shiftDate(current, 1))}
        className="btn btn-ghost text-lg leading-none w-10 h-10 flex items-center justify-center"
        aria-label="Próximo dia"
      >
        ›
      </button>
      {current !== today && (
        <button onClick={() => navigate(today)} className="btn btn-ghost text-xs">
          Hoje
        </button>
      )}
    </div>
  );
}
