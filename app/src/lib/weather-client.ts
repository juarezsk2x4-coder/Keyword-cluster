import type { WeatherSummary } from "./types";

// Open-Meteo: free, no API key, no account — fits this app's minimal-secrets
// posture. Docs: https://open-meteo.com/en/docs
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather codes (https://open-meteo.com/en/docs -> "WMO Weather interpretation
// codes"), collapsed to the small set of conditions the UI actually needs.
function conditionFromWmoCode(code: number): WeatherSummary["condition"] {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3 || (code >= 45 && code <= 48)) return "cloudy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "rain"; // snow — irrelevant in Florianópolis, folded into rain-like
  if (code >= 95) return "storm";
  return "other";
}

export async function fetchWeatherForecast(lat: number, lon: number): Promise<WeatherSummary> {
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=America%2FSao_Paulo&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed with status ${res.status}`);
  }
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time?.[0]) {
    throw new Error("Open-Meteo response missing expected daily forecast data");
  }

  return {
    date: daily.time[0],
    condition: conditionFromWmoCode(daily.weathercode[0]),
    temp_max_c: daily.temperature_2m_max[0],
    temp_min_c: daily.temperature_2m_min[0],
    precip_prob_pct: daily.precipitation_probability_max[0],
  };
}

// Mirrors logAnthropicError in anthropic-client.ts: every weather fetch
// failure leaves a trace in Vercel's function logs instead of vanishing
// silently when the caller swallows it to keep the page rendering.
export function logWeatherError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[weather] ${context} failed: ${message}`);
}
