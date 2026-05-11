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
}

export interface MealLog {
  id?: number;
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
  date: string;
  hours: number;
  quality?: number;
  logged_at: string;
}

export interface SubstanceLog {
  id?: number;
  date: string;
  substance: "cocaine" | "alcohol" | "cannabis" | "tobacco" | "benzo" | "psychedelic" | "ketamine";
  amount?: string;
  notes?: string;
  logged_at: string;
}

export interface FatigueLog {
  id?: number;
  date: string;
  logged_at: string;
}

export interface PrepTimeLog {
  id?: number;
  date: string;
  available_minutes: number;
  logged_at: string;
}

export type BeverageType = "mate" | "coffee" | "tea" | "treat";

export interface BeverageLog {
  id?: number;
  date: string;
  type: BeverageType;
  amount?: string;
  consumed_at: string;     // ISO datetime
  notes?: string;
  logged_at: string;
}
