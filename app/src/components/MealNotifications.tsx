"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { todayIso } from "@/lib/dates";
import type { MealCard as MealCardType, PersonId } from "@/lib/types";

interface Props {
  meals: MealCardType[];
  lang: Lang;
  date: string;
  personId: PersonId;
}

type PermState = "default" | "granted" | "denied" | "unsupported";

function isToday(iso: string): boolean {
  return iso === todayIso();
}

export default function MealNotifications({ meals, lang, date, personId }: Props) {
  const tr = t(lang);
  const storageKey = `notifications_enabled_${personId}`;
  const [permState, setPermState] = useState<PermState>("default");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermState("unsupported");
      return;
    }
    setPermState(Notification.permission as PermState);
    setEnabled(localStorage.getItem(storageKey) === "true");
  }, [storageKey]);

  // Schedule notifications when enabled
  useEffect(() => {
    if (!enabled || permState !== "granted" || !isToday(date)) return;
    if (typeof window === "undefined") return;

    const timers: number[] = [];
    const now = new Date();

    meals.forEach((meal) => {
      const [h, m] = meal.scheduled_time.split(":").map(Number);
      const target = new Date();
      target.setHours(h ?? 0, m ?? 0, 0, 0);
      const ms = target.getTime() - now.getTime();
      if (ms <= 0 || ms > 24 * 60 * 60 * 1000) return;

      const id = window.setTimeout(() => {
        const slotLabel = tr.slots[meal.slot];
        const mealLabel = meal.alternatives.original.label;
        new Notification(tr.notification_title(slotLabel), {
          body: tr.notification_body(mealLabel, meal.scheduled_time),
          tag: `meal-${date}-${meal.slot}`,
          icon: "/favicon.ico",
        });
      }, ms);
      timers.push(id);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [enabled, permState, date, meals, tr]);

  if (permState === "unsupported") {
    return (
      <div className="card mb-3">
        <div className="label mb-1">{tr.notifications}</div>
        <p className="text-xs text-muted">{tr.notifications_unsupported}</p>
      </div>
    );
  }

  const handleEnable = async () => {
    if (permState === "denied") return;
    if (permState === "default") {
      const result = await Notification.requestPermission();
      setPermState(result as PermState);
      if (result === "granted") {
        setEnabled(true);
        localStorage.setItem(storageKey, "true");
      }
    } else if (permState === "granted") {
      const next = !enabled;
      setEnabled(next);
      localStorage.setItem(storageKey, next ? "true" : "false");
    }
  };

  const buttonLabel =
    permState === "denied"
      ? tr.notifications_denied
      : enabled
      ? tr.notifications_enabled
      : tr.notifications_enable;

  return (
    <div className="card mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="label">🔔 {tr.notifications}</div>
        <button
          type="button"
          onClick={handleEnable}
          disabled={permState === "denied"}
          className={`btn text-xs disabled:opacity-50 ${enabled ? "btn-ghost" : "btn-primary"}`}
        >
          {enabled ? tr.notif_on : tr.notif_off}
        </button>
      </div>
      <p className="text-xs text-muted mt-1.5">{buttonLabel}</p>
    </div>
  );
}
