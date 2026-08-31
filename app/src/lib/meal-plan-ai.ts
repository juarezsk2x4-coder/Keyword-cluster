import Anthropic from "@anthropic-ai/sdk";
import type { DailyPlan, MealLog, PersonProfile } from "./types";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (clientInstance) return clientInstance;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  clientInstance = new Anthropic();
  return clientInstance;
}

export interface RecentLogSummary {
  date: string;
  total_kcal: number;
  total_protein_g: number;
  meals_logged: number;
  missed_slots: string[];
  states_picked: string[];
}

const MEAL_VERSION_SCHEMA = {
  type: "object",
  properties: {
    label: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
    prep_minutes: { type: "integer" },
    kcal: { type: "integer" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fat_g: { type: "number" },
    prep_steps: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
  required: ["label", "ingredients", "prep_minutes", "kcal", "protein_g", "carbs_g", "fat_g"],
  additionalProperties: false,
} as const;

const MEAL_CARD_SCHEMA = {
  type: "object",
  properties: {
    slot: {
      type: "string",
      enum: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar", "snack_noturno"],
    },
    scheduled_time: { type: "string", description: "HH:MM 24-hour" },
    alternatives: {
      type: "object",
      properties: {
        original: MEAL_VERSION_SCHEMA,
        easy: MEAL_VERSION_SCHEMA,
        liquid: MEAL_VERSION_SCHEMA,
        no_hunger: MEAL_VERSION_SCHEMA,
      },
      required: ["original", "easy", "liquid", "no_hunger"],
      additionalProperties: false,
    },
  },
  required: ["slot", "scheduled_time", "alternatives"],
  additionalProperties: false,
} as const;

const DAILY_PLAN_SCHEMA = {
  type: "object",
  properties: {
    date: { type: "string", description: "ISO YYYY-MM-DD" },
    day_of_week: { type: "string" },
    is_skate_day: { type: "boolean" },
    is_work_day: { type: "boolean" },
    kcal_target: { type: "integer" },
    protein_g_target: { type: "integer" },
    carb_g_target: { type: "integer" },
    fat_g_target: { type: "integer" },
    meals: { type: "array", items: MEAL_CARD_SCHEMA, minItems: 6, maxItems: 6 },
  },
  required: [
    "date",
    "day_of_week",
    "is_skate_day",
    "is_work_day",
    "kcal_target",
    "protein_g_target",
    "carb_g_target",
    "fat_g_target",
    "meals",
  ],
  additionalProperties: false,
} as const;

const WEEKLY_PLAN_SCHEMA = {
  type: "object",
  properties: {
    days: { type: "array", items: DAILY_PLAN_SCHEMA, minItems: 7, maxItems: 7 },
  },
  required: ["days"],
  additionalProperties: false,
} as const;

function buildSystemPrompt(profile: PersonProfile, lang: "pt" | "en"): string {
  const hardNo = profile.food_preferences.hard_no.join(", ");
  const textures = profile.food_preferences.texture_aversions.join(", ");
  const dislikes = profile.food_preferences.soft_dislikes.join(", ");
  const flags = profile.medical_flags.join(", ");

  if (lang === "en") {
    return `You design 7-day meal plans for ${profile.name}. Output a JSON object {"days": DailyPlan[]} matching the schema.

Snapshot: Age ${profile.age_years}, ${profile.height_cm}cm, ${profile.weight_kg}kg, BMR ~${profile.estimated_bmr_kcal} kcal.
Goal: ${profile.goals.primary}. Performance focus: ${profile.goals.performance_focus.join(", ") || "none specified"}.
Clinical flags: ${flags || "none"}.
HARD NO (absolute block, never include in any form including sauces or hidden): ${hardNo || "none"}.
Texture aversions: ${textures || "none"}.
Soft dislikes: ${dislikes || "none"}.

Day-type rules: no fixed special-activity days for this person. Set is_skate_day to false on every day. Use kcal_target = ${profile.nutrition_targets.total_kcal_target_off_day} and protein_g_target = ${profile.nutrition_targets.protein_g_per_day} every day. is_work_day should reflect a normal weekday/weekend split (true Mon-Fri, false Sat-Sun) unless logs suggest otherwise.
6 slots every day: cafe_da_manha, lanche_manha, almoco, lanche_tarde, jantar, snack_noturno, at reasonable times across the day.

For every slot, provide 4 alternatives:
- original = the planned full version
- easy = <8min prep, grab-and-eat
- liquid = smoothie, shake, or soup
- no_hunger = minimum viable intake

Each ingredient string must include quantity. Prep_minutes integer. Macros realistic. Notes optional but if present <120 chars.

Respond ONLY with the JSON object {"days": [...]}.`;
  }

  return `Você projeta planos alimentares de 7 dias para ${profile.name}. Retorne objeto JSON {"days": DailyPlan[]} seguindo o schema.

Perfil: ${profile.age_years} anos, ${profile.height_cm}cm, ${profile.weight_kg}kg, BMR ~${profile.estimated_bmr_kcal} kcal.
Objetivo: ${profile.goals.primary}. Foco de performance: ${profile.goals.performance_focus.join(", ") || "nenhum especificado"}.
Flags clínicas: ${flags || "nenhuma"}.
BLOQUEIO ABSOLUTO (nunca incluir nem em molhos / forma escondida): ${hardNo || "nenhum"}.
Aversões de textura: ${textures || "nenhuma"}.
Não curte: ${dislikes || "nenhum"}.

Regras por dia: sem dias de atividade especial fixos pra essa pessoa. is_skate_day sempre false. Use kcal_target = ${profile.nutrition_targets.total_kcal_target_off_day} e protein_g_target = ${profile.nutrition_targets.protein_g_per_day} todos os dias. is_work_day deve refletir uma divisão normal de semana (true seg-sex, false sáb-dom) a menos que os logs sugiram outra coisa.
6 slots por dia: cafe_da_manha, lanche_manha, almoco, lanche_tarde, jantar, snack_noturno, em horários razoáveis ao longo do dia.

Pra cada slot, 4 alternativas:
- original = versão planejada completa
- easy = <8min prep, pegar e comer
- liquid = smoothie, shake ou sopa
- no_hunger = mínimo viável

Cada ingrediente inclui quantidade. Prep_minutes inteiro. Macros realistas. Notes opcional, se houver <120 chars.

Responda APENAS com o objeto JSON {"days": [...]}.`;
}

function buildUserMessage(
  weekStartIso: string,
  recentLogs: RecentLogSummary[],
  lang: "pt" | "en"
): string {
  const lines = recentLogs.map(
    (r) =>
      `${r.date}: ${r.total_kcal} kcal, ${r.total_protein_g}g protein, ${r.meals_logged}/6 slots, states=[${r.states_picked.join("|")}], missed=[${r.missed_slots.join("|")}]`
  );

  if (lang === "en") {
    return `Generate the meal plan for the week starting Sunday ${weekStartIso}.

Last 7 days of logs (most recent first):
${lines.length ? lines.join("\n") : "(no prior logs — first week)"}

Adapt based on patterns: if recent kcal is low, prefer denser meals; if protein is low, push protein-forward versions; if many "easy/liquid" states were picked, lean into easy defaults; if certain slots were repeatedly missed, simplify those slots.`;
  }

  return `Gere o plano da semana começando domingo ${weekStartIso}.

Últimos 7 dias de logs (mais recente primeiro):
${lines.length ? lines.join("\n") : "(sem logs anteriores — primeira semana)"}

Adapte aos padrões: se kcal recente baixo, priorize refeições mais densas; se proteína baixa, versões protein-forward; se muitos estados "easy/liquid" foram escolhidos, ajuste easy defaults; se slots foram repetidamente pulados, simplifique-os.`;
}

export async function generateWeeklyPlan(
  profile: PersonProfile,
  recentLogs: RecentLogSummary[],
  weekStartIso: string,
  lang: "pt" | "en"
): Promise<DailyPlan[]> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    output_config: {
      format: {
        type: "json_schema",
        schema: WEEKLY_PLAN_SCHEMA,
      },
      effort: "medium",
    },
    system: buildSystemPrompt(profile, lang),
    messages: [{ role: "user", content: buildUserMessage(weekStartIso, recentLogs, lang) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in response");
  }

  const parsed = JSON.parse(textBlock.text) as { days: DailyPlan[] };
  if (!Array.isArray(parsed.days) || parsed.days.length !== 7) {
    throw new Error("Invalid plan: expected 7 days");
  }
  return parsed.days;
}

export function summarizeMealLogs(logs: MealLog[]): RecentLogSummary[] {
  const ALL_SLOTS = ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar", "snack_noturno"];
  const byDate = new Map<string, MealLog[]>();
  for (const log of logs) {
    const arr = byDate.get(log.date) ?? [];
    arr.push(log);
    byDate.set(log.date, arr);
  }
  const out: RecentLogSummary[] = [];
  for (const [date, dayLogs] of byDate) {
    out.push({
      date,
      total_kcal: dayLogs.reduce((acc, m) => acc + (m.kcal ?? 0), 0),
      total_protein_g: dayLogs.reduce((acc, m) => acc + (m.protein_g ?? 0), 0),
      meals_logged: dayLogs.length,
      missed_slots: ALL_SLOTS.filter((s) => !dayLogs.find((m) => m.slot === s)),
      states_picked: dayLogs.map((m) => m.selected_state),
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
