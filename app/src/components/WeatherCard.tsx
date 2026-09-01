import type { WeatherSummary } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  weather: WeatherSummary | null;
  isGoodSkateDay: boolean;
  lang: Lang;
}

const CONDITION_EMOJI: Record<WeatherSummary["condition"], string> = {
  clear: "☀️",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
  other: "🌡️",
};

export default function WeatherCard({ weather, isGoodSkateDay, lang }: Props) {
  if (!weather) return null;
  const tr = t(lang);

  return (
    <div className="card h-full flex flex-col justify-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{CONDITION_EMOJI[weather.condition]}</span>
        <div>
          <div className="text-sm text-text">{tr.weather[weather.condition]}</div>
          <div className="text-xs text-muted">{tr.weather.temp_range(weather.temp_max_c, weather.temp_min_c)}</div>
        </div>
      </div>
      {isGoodSkateDay && (
        <div className="text-xs font-medium text-accent">
          {tr.weather.good_skate_weather}
        </div>
      )}
    </div>
  );
}
