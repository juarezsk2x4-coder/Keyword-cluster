export type PersonId = "person_a" | "person_b";

export type MealSlot =
  | "cafe_da_manha"
  | "lanche_manha"
  | "almoco"
  | "lanche_tarde"
  | "jantar"
  | "snack_noturno";

export type CardState = "original" | "easy" | "liquid" | "no_hunger";

export const MEAL_SLOTS: MealSlot[] = [
  "cafe_da_manha",
  "lanche_manha",
  "almoco",
  "lanche_tarde",
  "jantar",
  "snack_noturno",
];

export const SLOT_LABELS: Record<MealSlot, string> = {
  cafe_da_manha: "Café da manhã",
  lanche_manha: "Lanche da manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da tarde",
  jantar: "Jantar",
  snack_noturno: "Snack noturno",
};

export const STATE_LABELS: Record<CardState, string> = {
  original: "Original",
  easy: "Fácil",
  liquid: "Líquido",
  no_hunger: "Sem fome",
};

export const STATE_DESCRIPTIONS: Record<CardState, string> = {
  original: "Refeição completa planejada",
  easy: "Pegar e comer, <5min, sem cozinhar",
  liquid: "Smoothie, shake ou sopa",
  no_hunger: "Mínimo pra não quebrar a cadeia",
};

export interface MealVersion {
  label: string;
  ingredients: string[];
  prep_minutes: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_steps?: string[];
  notes?: string;
}

export interface MealCard {
  slot: MealSlot;
  scheduled_time: string;
  alternatives: Record<CardState, MealVersion>;
}

export interface DailyPlan {
  date: string;
  day_of_week: string;
  is_skate_day: boolean;
  is_work_day: boolean;
  kcal_target: number;
  protein_g_target: number;
  carb_g_target: number;
  fat_g_target: number;
  meals: MealCard[];
}

export interface PersonProfile {
  name: string;
  age_years: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct: number;
  estimated_bmr_kcal: number;
  goals: { primary: string; performance_focus: string[]; philosophical: string };
  nutrition_targets: {
    protein_g_per_day: number;
    hydration_l_per_day: number;
    total_kcal_target_off_day: number;
    total_kcal_target_skate_day: number;
  };
  medical_flags: string[];
  food_preferences: {
    hard_no: string[];
    texture_aversions: string[];
    soft_dislikes: string[];
  };
  // These two are data-driven opt-ins rather than hardcoded to a specific
  // person_id — any profile (not just "person_a") can set them and get the
  // same treatment, so adding a third/fourth person never requires a code
  // change, just their own YAML.
  has_custom_meal_plan?: boolean; // true = has a hand-authored seed-plan.ts week + tailored AI prompt
  clinical_brief_path?: string;   // optional path to a fuller clinical write-up, shown on /profile if set
  // Opt-in, same as above: only a profile that sets this gets a weather
  // lookup + "good skate weather" nudge on the home page.
  location?: {
    city: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
  };
  // Opt-in, same pattern as above: a simple list of what to show on the
  // home page's daily supplement checklist. Deliberately just labels, not
  // the richer dose/frequency/prescriber detail that lives in the YAML's
  // substances.supplements_prescribed block (that block isn't read by the
  // app at all — this one is, so it's the one to keep in sync when the
  // regimen changes).
  daily_supplements?: string[];
  // Opt-in, same pattern: preset labels for the daily exercise log's tap
  // chips. The app adds a fixed "other" free-text option on top of this
  // list — not listed here since it isn't a profile-specific label.
  loggable_exercises?: string[];
}

export interface WeatherSummary {
  date: string;
  condition: "clear" | "cloudy" | "rain" | "storm" | "other";
  temp_max_c: number;
  temp_min_c: number;
  precip_prob_pct: number;
}

export interface MealLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  slot: MealSlot;
  selected_state: CardState;
  actual_label?: string;
  kcal?: number;
  protein_g?: number;
  notes?: string;
  logged_at: string;
}

export interface SleepLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  hours: number;
  quality?: number;
  logged_at: string;
}

export interface SubstanceLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  substance: "stimulant" | "alcohol" | "cannabis" | "tobacco" | "benzo" | "psychedelic" | "ketamine";
  amount?: string;
  notes?: string;
  logged_at: string;
}

export interface FatigueLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  logged_at: string;
}

export interface PrepTimeLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  available_minutes: number;
  logged_at: string;
}

export type BeverageType = "mate" | "coffee" | "tea" | "treat";

export interface BeverageLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  type: BeverageType;
  amount?: string;
  consumed_at: string;     // ISO datetime
  notes?: string;
  logged_at: string;
}

export interface SupplementLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  supplement_name: string;   // matches an entry in profile.daily_supplements
  logged_at: string;
}

export interface ExerciseLog {
  id?: number;
  person_id?: PersonId;
  date: string;
  exercise_type: string;     // matches an entry in profile.loggable_exercises, or "other"
  custom_label?: string;     // only meaningful when exercise_type === "other"
  logged_at: string;
}
