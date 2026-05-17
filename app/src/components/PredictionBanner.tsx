"use client";

import { useState } from "react";
import type { Prediction } from "@/lib/predictions";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  prediction: Prediction;
  lang: Lang;
}

function severityColor(s: "info" | "warning" | "alert"): { bg: string; border: string; color: string } {
  if (s === "alert") return { bg: "#3a1d1a", border: "#e87b6b", color: "#e87b6b" };
  if (s === "warning") return { bg: "#3a2d18", border: "#e8b06b", color: "#e8b06b" };
  return { bg: "#1a2820", border: "#7cc4a4", color: "#7cc4a4" };
}

export default function PredictionBanner({ prediction, lang }: Props) {
  const tr = t(lang);
  const [expanded, setExpanded] = useState(false);

  const hasData = prediction.days_with_data > 0 || prediction.insights.length > 0;
  const hasAdjustments =
    prediction.protein_boost_g > 0 ||
    prediction.kcal_boost > 0 ||
    prediction.hydration_extra_l > 0;

  if (!hasData) {
    return (
      <div className="card mb-3">
        <div className="label mb-1">{tr.predictions_title}</div>
        <p className="text-xs text-muted">{tr.predictions_no_data}</p>
      </div>
    );
  }

  const insightsToShow = expanded ? prediction.insights : prediction.insights.slice(0, 1);

  return (
    <div className="card mb-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div>
          <div className="label">{tr.predictions_title}</div>
          {prediction.days_with_data > 0 && (
            <div className="text-xs text-muted mt-0.5">
              {tr.predictions_avg_summary(
                prediction.avg_kcal_last_3,
                prediction.avg_protein_last_3,
                prediction.days_with_data
              )}
            </div>
          )}
        </div>
        <span className="text-muted text-xs">{expanded ? "▴" : "▾"}</span>
      </button>

      <div className="space-y-1.5 mt-3">
        {insightsToShow.map((ins, i) => {
          const c = severityColor(ins.severity);
          let text = "";
          switch (ins.key) {
            case "protein_deficit":
              text = tr.insight.protein_deficit(
                Number(ins.payload?.pct ?? 0),
                Number(ins.payload?.boost ?? 0)
              );
              break;
            case "kcal_deficit":
              text = tr.insight.kcal_deficit(
                Number(ins.payload?.pct ?? 0),
                Number(ins.payload?.boost ?? 0)
              );
              break;
            case "kcal_surplus":
              text = tr.insight.kcal_surplus(Number(ins.payload?.pct ?? 0));
              break;
            case "missed_meals":
              text = tr.insight.missed_meals(Number(ins.payload?.count ?? 0));
              break;
            case "easy_streak":
              text = tr.insight.easy_streak(Number(ins.payload?.days ?? 0));
              break;
            case "fatigue_streak":
              text = tr.insight.fatigue_streak(Number(ins.payload?.days ?? 0));
              break;
            case "post_substance":
              text = tr.insight.post_substance;
              break;
            case "post_alcohol":
              text = tr.insight.post_alcohol;
              break;
            case "sleep_short":
              text = tr.insight.sleep_short(Number(ins.payload?.hours ?? 0));
              break;
            case "sleep_long":
              text = tr.insight.sleep_long(Number(ins.payload?.hours ?? 0));
              break;
            case "on_track":
              text = tr.insight.on_track;
              break;
          }
          return (
            <div
              key={i}
              className="text-xs rounded-lg p-2 border"
              style={{ background: c.bg, borderColor: c.border, color: c.color }}
            >
              {text}
            </div>
          );
        })}
        {!expanded && prediction.insights.length > 1 && (
          <p className="text-xs text-muted text-center">
            +{prediction.insights.length - 1}
          </p>
        )}
      </div>

      {hasAdjustments && expanded && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="label mb-2">{tr.predictions_adjustments_title}</div>
          <ul className="text-xs text-text space-y-1 list-disc list-inside">
            {prediction.protein_boost_g > 0 && (
              <li>{tr.predictions_protein_boost(prediction.protein_boost_g)}</li>
            )}
            {prediction.kcal_boost > 0 && (
              <li>{tr.predictions_kcal_boost(prediction.kcal_boost)}</li>
            )}
            {prediction.hydration_extra_l > 0 && (
              <li>{tr.predictions_hydration_extra(prediction.hydration_extra_l)}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
