import Anthropic from "@anthropic-ai/sdk";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (clientInstance) return clientInstance;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  clientInstance = new Anthropic();
  return clientInstance;
}

export interface NutritionEstimate {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: "low" | "medium" | "high";
  notes: string;
}

const SYSTEM_PROMPT_PT = `Você é um estimador nutricional para refeições brasileiras (especialmente cozinha sulista) e descrições internacionais.

Dado um texto livre descrevendo uma refeição, retorne JSON com:
- kcal: calorias totais estimadas (inteiro)
- protein_g: gramas de proteína (decimal)
- carbs_g: gramas de carboidrato (decimal)
- fat_g: gramas de gordura (decimal)
- confidence: "low" | "medium" | "high"
- notes: nota curta em português sobre suas suposições (max 100 chars)

Regras:
- Se a porção não for especificada, assuma porção típica de adulto brasileiro
- Ajuste pelo método de preparo: grelhado/assado/cozido = menos gordura; frito/à milanesa = mais gordura
- Cortes magros (patinho, peito de frango sem pele, filé mignon, lombo suíno) ~150-200 kcal/100g cozido
- Cortes mais gordos (entrecot, costela, picanha com capa) ~250-350 kcal/100g cozido
- Arroz branco cozido ~130 kcal/100g
- Feijão preto/carioca cozido ~75 kcal/100g
- Macarrão integral cozido ~150 kcal/100g
- Aipim/batata-doce cozido ~120 kcal/100g
- Porção padrão de proteína: 120-150g cozido
- Porção padrão de carbo: 100-150g cozido
- Vegetais cozidos: ~30 kcal/100g, ignorar para macros precisos
- confidence="low" se descrição vaga ou quantidades muito incertas
- confidence="high" se descrição específica com porções claras
- Pratos típicos referência:
  - X-burguer típico fast-food: ~550 kcal / 25P / 45C / 30F
  - Prato comercial (arroz+feijão+carne+salada): ~700 kcal / 45P / 85C / 20F
  - Marmita fitness: ~500 kcal / 40P / 50C / 15F
  - Poke bowl: ~620 kcal / 38P / 65C / 22F
  - Iogurte natural + granola + frutas + castanhas: ~520 kcal / 18P / 60C / 22F

Responda APENAS o JSON, sem explicações adicionais.`;

const SYSTEM_PROMPT_EN = `You estimate nutritional values for meals in Brazilian (especially southern Brazilian / sulista) and international cuisine.

Given a free-text meal description, return JSON with:
- kcal: total estimated calories (integer)
- protein_g: grams of protein (decimal)
- carbs_g: grams of carbohydrate (decimal)
- fat_g: grams of fat (decimal)
- confidence: "low" | "medium" | "high"
- notes: short English note about your assumptions (max 100 chars)

Rules:
- If portion not specified, assume typical Brazilian adult portion
- Adjust by cooking method: grilled/roasted/boiled = less fat; fried/breaded = more fat
- Lean cuts (eye of round, skinless chicken breast, filet mignon, pork loin) ~150-200 kcal/100g cooked
- Fattier cuts (ribeye, ribs, picanha with cap) ~250-350 kcal/100g cooked
- White rice cooked ~130 kcal/100g
- Black/pinto beans cooked ~75 kcal/100g
- Whole-wheat pasta cooked ~150 kcal/100g
- Cassava/sweet potato cooked ~120 kcal/100g
- Standard protein portion: 120-150g cooked
- Standard carb portion: 100-150g cooked
- Cooked vegetables: ~30 kcal/100g, ignore for accuracy
- confidence="low" if vague description or unclear quantities
- confidence="high" if specific description with clear portions
- Reference dishes:
  - Typical fast-food burger: ~550 kcal / 25P / 45C / 30F
  - Brazilian commercial plate (rice+beans+meat+salad): ~700 kcal / 45P / 85C / 20F
  - Fitness meal prep: ~500 kcal / 40P / 50C / 15F
  - Poke bowl: ~620 kcal / 38P / 65C / 22F
  - Yogurt + granola + fruits + nuts: ~520 kcal / 18P / 60C / 22F

Respond with JSON only, no extra explanation.`;

const NUTRITION_SCHEMA = {
  type: "object",
  properties: {
    kcal: { type: "integer", description: "Total estimated calories" },
    protein_g: { type: "number", description: "Grams of protein" },
    carbs_g: { type: "number", description: "Grams of carbohydrates" },
    fat_g: { type: "number", description: "Grams of fat" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    notes: { type: "string", description: "Brief assumption notes" },
  },
  required: ["kcal", "protein_g", "carbs_g", "fat_g", "confidence", "notes"],
  additionalProperties: false,
} as const;

export async function estimateNutrition(
  description: string,
  lang: "pt" | "en"
): Promise<NutritionEstimate> {
  if (!description.trim()) {
    throw new Error("Empty description");
  }

  const client = getClient();
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 500,
    output_config: {
      format: {
        type: "json_schema",
        schema: NUTRITION_SCHEMA,
      },
      effort: "low",
    },
    system: lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_PT,
    messages: [{ role: "user", content: description }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in response");
  }

  const parsed = JSON.parse(textBlock.text) as NutritionEstimate;
  return parsed;
}

export function isAiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
