import type { DailyPlan, MealCard, MealVersion, MealSlot, PersonId, PersonProfile } from "./types";
import { getStoredWeeklyPlan } from "./query";
import { loadProfile } from "./profile";

// ─── Generic starter seed ──────────────────────────────────────────────────
//
// This is deliberately generic — no hand-authored recipes, no household-
// specific schedule. It exists so the app has *something* to show before a
// profile has generated its first AI plan. Customize GENERIC_MEALS below
// with your own go-to meals, or just rely on the AI Meal Plan Designer
// (/plan → "Generate with AI") once your profile YAML is filled in.

const DOW_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function genericPlaceholder(label: string, kcal: number, protein_g: number, carbs_g: number, fat_g: number): MealVersion {
  return { label, ingredients: [], prep_minutes: 10, kcal, protein_g, carbs_g, fat_g, notes: "Modelo inicial — gere um plano com IA pra personalizar." };
}

const GENERIC_MEALS: Record<MealSlot, { time: string; kcalShare: number; label: string }> = {
  cafe_da_manha: { time: "08:00", kcalShare: 0.2, label: "Iogurte natural + granola + fruta" },
  lanche_manha: { time: "10:30", kcalShare: 0.1, label: "Fruta + castanhas" },
  almoco: { time: "12:30", kcalShare: 0.3, label: "Proteína + carbo + salada" },
  lanche_tarde: { time: "16:00", kcalShare: 0.1, label: "Sanduíche integral simples" },
  jantar: { time: "20:00", kcalShare: 0.25, label: "Sopa ou proteína leve + vegetais" },
  snack_noturno: { time: "22:00", kcalShare: 0.05, label: "Iogurte + mel" },
};

export function buildGenericSeedPlan(weekStartIso: string, profile: PersonProfile): DailyPlan[] {
  const base = new Date(weekStartIso + "T00:00:00");
  const kcalTarget = profile.nutrition_targets.total_kcal_target_off_day;
  const proteinTarget = profile.nutrition_targets.protein_g_per_day;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const date = d.toISOString().slice(0, 10);

    const meals: MealCard[] = (Object.keys(GENERIC_MEALS) as MealSlot[]).map((slot) => {
      const spec = GENERIC_MEALS[slot];
      const kcal = Math.round(kcalTarget * spec.kcalShare);
      const protein_g = Math.round(proteinTarget * spec.kcalShare);
      const original = genericPlaceholder(spec.label, kcal, protein_g, Math.round(kcal * 0.5) / 4, Math.round(kcal * 0.25) / 9);
      const easy = genericPlaceholder(`${spec.label} (fácil)`, kcal, protein_g, Math.round(kcal * 0.5) / 4, Math.round(kcal * 0.25) / 9);
      const liquid = genericPlaceholder("Shake ou smoothie proteico", kcal, protein_g, Math.round(kcal * 0.5) / 4, Math.round(kcal * 0.2) / 9);
      const no_hunger = genericPlaceholder("Kombucha + fruta", Math.round(kcal * 0.4), Math.round(protein_g * 0.3), 20, 0);
      return { slot, scheduled_time: spec.time, alternatives: { original, easy, liquid, no_hunger } };
    });

    return {
      date,
      day_of_week: DOW_NAMES[d.getDay()],
      is_skate_day: false,
      is_work_day: true,
      kcal_target: kcalTarget,
      protein_g_target: proteinTarget,
      carb_g_target: Math.round((kcalTarget * 0.45) / 4),
      fat_g_target: Math.round((kcalTarget * 0.25) / 9),
      meals,
    };
  });
}

// ─── Plan resolution (DB-backed AI plan > generic starter) ────────────────────

export interface ResolvedWeeklyPlan {
  days: DailyPlan[];
  source: "seed" | "ai";
  generated_at?: string;
}

export async function resolveWeeklyPlan(personId: PersonId, weekStartIso: string): Promise<ResolvedWeeklyPlan> {
  const stored = await getStoredWeeklyPlan(personId, weekStartIso);
  if (stored) {
    try {
      const days = JSON.parse(stored.plan_json) as DailyPlan[];
      if (Array.isArray(days) && days.length === 7) {
        return { days, source: stored.source, generated_at: stored.generated_at };
      }
    } catch {
      // Fall through to seed
    }
  }
  return { days: buildGenericSeedPlan(weekStartIso, loadProfile(personId)), source: "seed" };
}

// ─── Shopping list (starter example — replace with your own staples) ─────────

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  estimated_weight_kg: number;
  route: "self_carry" | "delivery";
  store_suggestion: "forte_mensal" | "imperatriz_semanal" | "imperatriz_topup" | "ifood";
}

const STARTER_SHOPPING_LIST: ShoppingItem[] = [
  { name: "Peito de frango", quantity: "1 kg", category: "Proteína", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
  { name: "Ovos", quantity: "12 un", category: "Proteína", estimated_weight_kg: 0.7, route: "self_carry", store_suggestion: "imperatriz_semanal" },
  { name: "Arroz integral", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "forte_mensal" },
  { name: "Aveia em flocos", quantity: "500 g", category: "Carbo", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
  { name: "Feijão", quantity: "1 kg", category: "Leguminosa", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "forte_mensal" },
  { name: "Banana", quantity: "1 kg", category: "Fruta", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
  { name: "Iogurte natural", quantity: "2 un 1L", category: "Laticínio", estimated_weight_kg: 2.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
  { name: "Azeite extra virgem", quantity: "500 ml", category: "Óleo", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
  { name: "Água mineral galão 20L", quantity: "1 un", category: "Bebida", estimated_weight_kg: 20.0, route: "delivery", store_suggestion: "ifood" },
];

export function buildShoppingList(): { delivery: ShoppingItem[]; self_carry: ShoppingItem[] } {
  return {
    delivery: STARTER_SHOPPING_LIST.filter((i) => i.route === "delivery"),
    self_carry: STARTER_SHOPPING_LIST.filter((i) => i.route === "self_carry"),
  };
}
