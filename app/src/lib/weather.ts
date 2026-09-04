import { getDb, ensureMigrated } from "./db";
import { todayIso } from "./dates";
import { fetchWeatherForecast, logWeatherError } from "./weather-client";
import type { PersonProfile, WeatherSummary } from "./types";

interface WeatherCacheRow {
  date: string;
  condition: string;
  temp_max_c: number;
  temp_min_c: number;
  precip_prob_pct: number;
}

function rowToSummary(row: WeatherCacheRow): WeatherSummary {
  return {
    date: row.date,
    condition: row.condition as WeatherSummary["condition"],
    temp_max_c: row.temp_max_c,
    temp_min_c: row.temp_min_c,
    precip_prob_pct: row.precip_prob_pct,
  };
}

// Returns null when the profile has no location (weather is opt-in, same
// shape as clinical_brief_path) or when the fetch fails — a network hiccup
// should never break the home page, just leave the weather card absent.
export async function getTodayWeather(profile: PersonProfile): Promise<WeatherSummary | null> {
  if (!profile.location) return null;
  await ensureMigrated();

  const db = getDb();
  const date = todayIso();

  // Filtered by city as well as date: the cache is shared across profiles, and
  // keying on date alone handed whoever loaded the page first that day's
  // forecast to everyone, whatever city they're actually in.
  const cached = await db.execute({
    sql: `SELECT date, condition, temp_max_c, temp_min_c, precip_prob_pct FROM weather_cache WHERE date = ? AND city = ?`,
    args: [date, profile.location.city],
  });
  if (cached.rows.length > 0) {
    return rowToSummary(cached.rows[0] as unknown as WeatherCacheRow);
  }

  try {
    const forecast = await fetchWeatherForecast(profile.location.lat, profile.location.lon);
    await db.execute({
      sql: `INSERT INTO weather_cache (date, city, condition, temp_max_c, temp_min_c, precip_prob_pct)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, city) DO UPDATE SET
              condition = excluded.condition,
              temp_max_c = excluded.temp_max_c,
              temp_min_c = excluded.temp_min_c,
              precip_prob_pct = excluded.precip_prob_pct,
              fetched_at = CURRENT_TIMESTAMP`,
      args: [
        date,
        profile.location.city,
        forecast.condition,
        forecast.temp_max_c,
        forecast.temp_min_c,
        forecast.precip_prob_pct,
      ],
    });
    return forecast;
  } catch (err) {
    logWeatherError(`getTodayWeather(${profile.location.city})`, err);
    return null;
  }
}
