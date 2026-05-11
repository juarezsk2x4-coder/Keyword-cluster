"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function labelFor(iso: string, lang: Lang): string {
  const today = todayIso();
  const yest = shiftDate(today, -1);
  const tom = shiftDate(today, 1);
  const tr = t(lang);
  if (iso === today) return tr.today;
  if (iso === yest) return tr.yesterday;
  if (iso === tom) return tr.tomorrow;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function DateNavigator({ current, lang }: { current: string; lang: Lang }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tr = t(lang);

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
        type="button"
        onClick={() => navigate(shiftDate(current, -1))}
        className="btn btn-ghost text-lg leading-none w-10 h-10 flex items-center justify-center"
        aria-label={tr.prev_day}
      >
        ‹
      </button>
      <div className="flex-1 text-center">
        <div className="font-semibold capitalize">{labelFor(current, lang)}</div>
        <div className="text-xs text-muted">{current}</div>
      </div>
      <button
        type="button"
        onClick={() => navigate(shiftDate(current, 1))}
        className="btn btn-ghost text-lg leading-none w-10 h-10 flex items-center justify-center"
        aria-label={tr.next_day}
      >
        ›
      </button>
      {current !== today && (
        <button type="button" onClick={() => navigate(today)} className="btn btn-ghost text-xs">
          {tr.jump_to_today}
        </button>
      )}
    </div>
  );
}
