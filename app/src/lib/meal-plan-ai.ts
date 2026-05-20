import Anthropic from "@anthropic-ai/sdk";
import type { DailyPlan, MealCard, MealVersion } from "./types";
import { MEAL_SLOTS } from "./types";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (clientInstance) return clientInstance;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  clientInstance = new Anthropic();
  return clientInstance;
}

export function isAiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const DAY_NAMES_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface RecentLogSummary {
  date: string;
  meals_logged: number;
  total_kcal: number;
  total_protein_g: number;
  missed_slots: string[];
  state_counts: Record<string, number>;
  substances: string[];
  sleep_hours: number | null;
  was_fatigued: boolean;
}

export interface ProfileSummary {
  hard_no: string[];
  texture_aversions: string[];
  soft_dislikes: string[];
  medical_flags: string[];
  protein_g_target: number;
  hydration_l_target: number;
  kcal_target_off: number;
  kcal_target_skate: number;
}

const SYSTEM_PT = `Você é o Meal Plan Designer pra um adulto brasileiro (sulista) seguindo recomp eucalórica.

Regras inegociáveis:
- NUNCA inclua tomate em qualquer forma (in natura, molho, extrato, ketchup, sugo, polpa, conservas, lasanha tradicional, pizza marinara). É alergia confirmada.
- Vocabulário pt-BR sulista: aipim (não mandioca), bergamota (não mexerica), vagem, pão francês, etc.
- Domingo e segunda são skate days (~3300 kcal). Outros dias são work days (~2500 kcal, 130g proteína).
- Sexta jantar é slot reservado pra delivery aceitável (poke/sushi/peruano/japonês — NUNCA hambúrguer junk).
- Quinta e sábado de manhã: defaults líquidos pra recovery (caso tenha tido coca quarta/sexta).
- 6 slots por dia: cafe_da_manha, lanche_manha, almoco, lanche_tarde, jantar, snack_noturno.
- 4 alternativas por slot: original (refeição completa), easy (<5min, sem cozinhar), liquid (smoothie/shake/sopa), no_hunger (mínimo pra não quebrar a cadeia).
- Cada MealVersion precisa: label, ingredients (array de strings com porções), prep_minutes (int), kcal (int), protein_g, carbs_g, fat_g (decimais), opcional prep_steps (array), opcional notes.
- Use os logs da semana passada pra calibrar: se a pessoa pulou refeições ou foi muito de líquido/easy, sugira opções mais simples; se ficou em déficit de proteína, aumente.
- Horários sugeridos: 07:30, 10:30, 12:30 (work) / 13:00 (skate), 16:00, 20:00, 22:30.

Retorne APENAS o JSON conforme schema.`;

const SYSTEM_EN = `You are the Meal Plan Designer for a Brazilian (southern) adult on eucaloric recomp.

Non-negotiable rules:
- NEVER include tomato in any form (fresh, sauce, paste, ketchup, sugo, canned, traditional lasagna, marinara pizza). Confirmed allergy.
- pt-BR southern vocabulary: aipim (not mandioca), bergamota (not mexerica), vagem, pão francês, etc.
- Sunday and Monday are skate days (~3300 kcal). Other days are work days (~2500 kcal, 130g protein).
- Friday dinner is reserved for acceptable delivery (poke/sushi/Peruvian/Japanese — NEVER burger junk).
- Thursday and Saturday breakfast: liquid defaults for recovery (in case of cocaine on Wed/Fri).
- 6 slots per day: cafe_da_manha, lanche_manha, almoco, lanche_tarde, jantar, snack_noturno.
- 4 alternatives per slot: original (full meal), easy (<5min, no cooking), liquid (smoothie/shake/soup), no_hunger (minimum to keep the chain unbroken).
- Each MealVersion needs: label, ingredients (string array with portions), prep_minutes (int), kcal (int), protein_g, carbs_g, fat_g (decimals), optional prep_steps (array), optional notes.
- Use last week's logs to calibrate: if meals were skipped or many easy/liquid picks, suggest simpler options; if protein deficit, boost protein.
- Suggested times: 07:30, 10:30, 12:30 (work) / 13:00 (skate), 16:00, 20:00, 22:30.

Return JSON only per schema.`;

const MEAL_VERSION_SCHEMA = {
  type: "object",
  properties: {
    label: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
    prep_minutes: { type: "integer", minimum: 0 },
    kcal: { type: "integer", minimum: 0 },
    protein_g: { type: "number", minimum: 0 },
    carbs_g: { type: "number", minimum: 0 },
    fat_g: { type: "number", minimum: 0 },
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
      enum: MEAL_SLOTS,
    },
    scheduled_time: { type: "string", pattern: "^[0-2][0-9]:[0-5][0-9]$" },
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
    date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    day_of_week: { type: "string" },
    is_skate_day: { type: "boolean" },
    is_work_day: { type: "boolean" },
    kcal_target: { type: "integer", minimum: 1000 },
    protein_g_target: { type: "integer", minimum: 50 },
    carb_g_target: { type: "integer", minimum: 0 },
    fat_g_target: { type: "integer", minimum: 0 },
    meals: {
      type: "array",
      items: MEAL_CARD_SCHEMA,
      minItems: 6,
      maxItems: 6,
    },
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
    days: {
      type: "array",
      items: DAILY_PLAN_SCHEMA,
      minItems: 7,
      maxItems: 7,
    },
  },
  required: ["days"],
  additionalProperties: false,
} as const;

function buildUserPrompt(
  weekStartIso: string,
  profile: ProfileSummary,
  recentLogs: RecentLogSummary[],
  lang: "pt" | "en"
): string {
  const dates: { iso: string; dow: string; isSkate: boolean }[] = [];
  const base = new Date(weekStartIso + "T00:00:00");
  const dayNames = lang === "en" ? DAY_NAMES_EN : DAY_NAMES_PT;
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    dates.push({ iso, dow: dayNames[dow], isSkate: dow === 0 || dow === 1 });
  }

  const datesBlock = dates
    .map((d) => `  - ${d.iso} (${d.dow})${d.isSkate ? " [skate]" : ""}`)
    .join("\n");

  const logsBlock = recentLogs.length
    ? recentLogs
        .map(
          (r) =>
            `  - ${r.date}: ${r.meals_logged} refeições, ${r.total_kcal} kcal, ${r.total_protein_g}g prot; states=${JSON.stringify(r.state_counts)}; missed=[${r.missed_slots.join(",")}]; subs=[${r.substances.join(",")}]; sleep=${r.sleep_hours ?? "?"}h; fatigued=${r.was_fatigued}`
        )
        .join("\n")
    : lang === "en"
      ? "  (no recent logs)"
      : "  (sem logs recentes)";

  const header = lang === "en" ? "Generate a weekly plan." : "Gere um plano semanal.";
  const profileLabel = lang === "en" ? "Profile" : "Perfil";
  const datesLabel = lang === "en" ? "Dates to cover (Sunday-anchored)" : "Datas a cobrir (ancorado em domingo)";
  const logsLabel = lang === "en" ? "Last 7 days of logs" : "Últimos 7 dias de logs";

  return `${header}

${profileLabel}:
  hard_no: [${profile.hard_no.join(", ")}]
  texture_aversions: [${profile.texture_aversions.join(", ")}]
  soft_dislikes: [${profile.soft_dislikes.join(", ")}]
  medical_flags: [${profile.medical_flags.join(", ")}]
  protein_g_target/day: ${profile.protein_g_target}
  hydration_l/day: ${profile.hydration_l_target}
  kcal_off_day: ${profile.kcal_target_off}
  kcal_skate_day: ${profile.kcal_target_skate}

${datesLabel}:
${datesBlock}

${logsLabel}:
${logsBlock}
`;
}

interface RawDailyPlan {
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

export async function generateWeeklyPlan(opts: {
  weekStartIso: string;
  profile: ProfileSummary;
  recentLogs: RecentLogSummary[];
  lang: "pt" | "en";
}): Promise<DailyPlan[]> {
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
    system: opts.lang === "en" ? SYSTEM_EN : SYSTEM_PT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(opts.weekStartIso, opts.profile, opts.recentLogs, opts.lang),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in response");
  }

  const parsed = JSON.parse(textBlock.text) as { days: RawDailyPlan[] };

  return parsed.days.map((d) => ({
    date: d.date,
    day_of_week: d.day_of_week,
    is_skate_day: d.is_skate_day,
    is_work_day: d.is_work_day,
    kcal_target: d.kcal_target,
    protein_g_target: d.protein_g_target,
    carb_g_target: d.carb_g_target,
    fat_g_target: d.fat_g_target,
    meals: d.meals.map((m) => ({
      slot: m.slot,
      scheduled_time: m.scheduled_time,
      alternatives: {
        original: cleanVersion(m.alternatives.original),
        easy: cleanVersion(m.alternatives.easy),
        liquid: cleanVersion(m.alternatives.liquid),
        no_hunger: cleanVersion(m.alternatives.no_hunger),
      },
    })),
  }));
}

function cleanVersion(v: MealVersion): MealVersion {
  return {
    label: v.label,
    ingredients: v.ingredients,
    prep_minutes: v.prep_minutes,
    kcal: v.kcal,
    protein_g: v.protein_g,
    carbs_g: v.carbs_g,
    fat_g: v.fat_g,
    ...(v.prep_steps && v.prep_steps.length > 0 ? { prep_steps: v.prep_steps } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
  };
}
