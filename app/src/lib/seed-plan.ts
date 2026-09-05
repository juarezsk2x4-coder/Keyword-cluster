import type { DailyPlan, MealCard, MealVersion, MealSlot, PersonId, PersonProfile } from "./types";
import { getStoredWeeklyPlan } from "./query";
import { loadProfile } from "./profile";
import { getSundayOfWeek, addDaysIso, dowForIso } from "./dates";

/* eslint-disable @typescript-eslint/no-unused-vars */

// ─── Reusable meal versions ───────────────────────────────────────────────────

const v = (m: MealVersion) => m;

const SHAKE_MANGA = v({
  label: "Smoothie manga + gengibre + limão + whey + linhaça",
  ingredients: [
    "manga 1 un",
    "gengibre fresco 1 colher chá",
    "limão tahiti meio",
    "whey isolado 30g",
    "linhaça moída 1 colher sopa",
    "leite integral 300ml",
    "mel 1 colher chá",
  ],
  prep_minutes: 3,
  kcal: 480,
  protein_g: 34,
  carbs_g: 55,
  fat_g: 12,
  prep_steps: ["Tudo no liquidificador 60s.", "Beber gelado."],
  notes: "Receita signature dele com proteína adicionada. Top pós-Venvanse sem fome.",
});

// Portions trimmed 2026-09: at 520 kcal this mid-morning snack plus PAO_ABACATE
// (480) made up 40% of a 2500 kcal day on its own, pushing every weekday ~24%
// over its own kcal_target. Granola halved, iogurte and mel reduced; the
// castanha-do-pará stays because it's there for selenium, not calories.
const IOGURTE_GRANOLA = v({
  label: "Iogurte natural + granola + frutas vermelhas + castanha-do-pará",
  ingredients: [
    "iogurte natural integral 170g",
    "granola sem açúcar 20g",
    "morango ou framboesa 100g",
    "castanha-do-pará 2 un",
  ],
  prep_minutes: 2,
  kcal: 285,
  protein_g: 10,
  carbs_g: 29,
  fat_g: 15,
  notes: "Anchor café/lanche. Selênio (Pará) + probióticos + polifenóis.",
});

const POKE_ATUM = v({
  label: "Poke bowl atum + arroz + abacate + edamame + cenoura + shoyu + gergelim",
  ingredients: [
    "atum fresco em cubos 120g",
    "arroz japonês cozido 150g (frio)",
    "abacate 1/2",
    "edamame 60g",
    "cenoura ralada 50g",
    "pepino japonês 1/2",
    "shoyu shoyu 1 colher sopa",
    "gergelim torrado 1 colher chá",
    "limão 1/2",
  ],
  prep_minutes: 8,
  kcal: 620,
  protein_g: 38,
  carbs_g: 65,
  fat_g: 22,
  prep_steps: ["Atum cru fresco — corte em cubos.", "Monte na tigela.", "Tempere com shoyu + limão + gergelim."],
  notes: "Sem tomate. Abacate em formato aceito (poke). Texturas firmes.",
});

const PATINHO_QUINOA = v({
  label: "Patinho refogado + quinoa + brócolis + cenoura + limão",
  ingredients: [
    "patinho moído magro 150g",
    "quinoa cozida 1 xícara",
    "brócolis ao vapor 1 xícara",
    "cenoura em cubos 1/2 xícara",
    "alho 2 dentes",
    "azeite 1 colher sopa",
    "limão 1/2",
    "cúrcuma + pimenta-do-reino a gosto",
  ],
  prep_minutes: 20,
  kcal: 580,
  protein_g: 42,
  carbs_g: 50,
  fat_g: 20,
  prep_steps: [
    "Refogue alho no azeite, junte patinho, doure.",
    "Cúrcuma + pimenta-do-reino + sal.",
    "Sirva sobre quinoa, brócolis ao lado, esprema limão sobre a carne.",
  ],
  notes: "Cúrcuma + pimenta = anti-inflamatório asma. Limão = ferro absorption.",
});

const SALMAO_BATATA = v({
  label: "Salmão grelhado + batata-doce roxa + rúcula + abacate em fatias",
  ingredients: [
    "filé de salmão 150g",
    "batata-doce roxa 200g",
    "rúcula 1 maço pequeno",
    "abacate 1/4 em fatias",
    "azeite 1 colher sopa",
    "limão 1/2",
    "alho 1 dente",
    "sal e pimenta",
  ],
  prep_minutes: 25,
  kcal: 680,
  protein_g: 38,
  carbs_g: 50,
  fat_g: 32,
  prep_steps: [
    "Batata-doce em rodelas no forno 200°C 25min.",
    "Salmão na frigideira 3min cada lado, pele pra baixo primeiro.",
    "Rúcula com limão e azeite. Abacate fatiado por cima.",
  ],
  notes: "Omega-3 + vit D + batata-doce roxa antocianinas. Anti-asma + anti-inflamatório.",
});

// current_chicken_phase in person_a.yml is "tolerant" today, but the
// clinical brief flags a documented chicken aversion as only provisionally
// resolved ("provisório até confirmar") — and explicitly says the system
// needs pre-built "if X isn't available, do Y" substitutions rather than
// asking him to improvise one in the moment (weak cognitive flexibility is
// the documented pattern, not a hypothetical). CURRY_SEM_FRANGO below is
// that pre-built fallback: swap FRANGO_CURRY for it (same slot, same
// macros, same anti-inflammatory spice base) the moment the phase reverses
// — no new recipe needs to be invented under pressure.
const FRANGO_CURRY = v({
  label: "Curry de frango com leite de coco + cuscuz marroquino + couve refogada",
  ingredients: [
    "peito de frango em cubos 150g",
    "leite de coco 100ml",
    "cebola roxa 1/2",
    "alho 2 dentes",
    "gengibre 1 colher chá",
    "cúrcuma 1 colher chá",
    "coentro em pó 1/2 colher chá",
    "cuscuz marroquino integral 80g (seco)",
    "couve manteiga 1/2 maço",
    "limão 1/2",
  ],
  prep_minutes: 25,
  kcal: 640,
  protein_g: 44,
  carbs_g: 55,
  fat_g: 22,
  prep_steps: [
    "Cuscuz: ferva 100ml água, junte cuscuz + sal + colher azeite, tampe 5min.",
    "Curry: refogue cebola + alho + gengibre, junte frango, doure, tempere, junte leite de coco.",
    "Couve: refogue rápido no alho. Sirva tudo + limão.",
  ],
  notes: "Indiana sem tomate. Cúrcuma + gengibre + cebola = anti-asma forte.",
});

const CURRY_SEM_FRANGO = v({
  label: "Curry de grão-de-bico + tofu com leite de coco + cuscuz marroquino + couve refogada",
  ingredients: [
    "grão-de-bico cozido 150g",
    "tofu firme em cubos 100g",
    "leite de coco 100ml",
    "cebola roxa 1/2",
    "alho 2 dentes",
    "gengibre 1 colher chá",
    "cúrcuma 1 colher chá",
    "coentro em pó 1/2 colher chá",
    "cuscuz marroquino integral 80g (seco)",
    "couve manteiga 1/2 maço",
    "limão 1/2",
  ],
  prep_minutes: 25,
  kcal: 630,
  protein_g: 32,
  carbs_g: 68,
  fat_g: 20,
  prep_steps: [
    "Cuscuz: ferva 100ml água, junte cuscuz + sal + colher azeite, tampe 5min.",
    "Curry: refogue cebola + alho + gengibre, junte grão-de-bico + tofu, tempere, junte leite de coco.",
    "Couve: refogue rápido no alho. Sirva tudo + limão.",
  ],
  notes: "Fallback pré-pronto se a fase de frango reverter — mesmas especiarias anti-asma, sem frango.",
});

const LINGUADO_KIMCHI = v({
  label: "Linguado grelhado + arroz preto + kimchi + brócolis + missô soup",
  ingredients: [
    "filé de linguado 180g",
    "arroz preto cozido 1 xícara",
    "kimchi 80g",
    "brócolis ao vapor 1 xícara",
    "missô 1 colher sopa",
    "água quente 200ml",
    "cebolinha 1 talo",
    "gengibre 1 fatia",
    "azeite + sal",
  ],
  prep_minutes: 20,
  kcal: 600,
  protein_g: 42,
  carbs_g: 52,
  fat_g: 18,
  prep_steps: [
    "Linguado seco com sal, grelha 2min cada lado.",
    "Missô: dilua na água quente, junte cebolinha + gengibre.",
    "Sirva com arroz preto, kimchi ao lado, brócolis, sopa de missô.",
  ],
  notes: "Coreana + fermentados (kimchi + missô) — alvo microbiota.",
});

const ROBALO_AIPIM = v({
  label: "Robalo assado + aipim cozido + repolho refogado + limão",
  ingredients: [
    "filé de robalo 180g",
    "aipim 200g",
    "repolho roxo 1 xícara",
    "alho 2 dentes",
    "azeite 1 colher sopa",
    "limão 1",
    "salsinha fresca",
    "pimenta-do-reino",
  ],
  prep_minutes: 30,
  kcal: 620,
  protein_g: 40,
  carbs_g: 56,
  fat_g: 18,
  prep_steps: [
    "Aipim cozido em água com sal até macio.",
    "Robalo no forno 180°C 15min com limão e azeite.",
    "Repolho refogado rápido no alho.",
  ],
  notes: "Sulista. Aipim = carbo pré-skate refeed.",
});

const SOPA_MISSO = v({
  label: "Sopa missô + tofu + cogumelo shitake + algas + ovo cozido picado",
  ingredients: [
    "missô 2 colheres sopa",
    "água 500ml",
    "tofu firme 80g em cubos",
    "shitake fresco 50g fatiado",
    "alga wakame seca 1 colher chá",
    "cebolinha 1 talo",
    "ovo cozido dura 1 un",
  ],
  prep_minutes: 10,
  kcal: 280,
  protein_g: 24,
  carbs_g: 18,
  fat_g: 12,
  notes: "Líquido proteico. Fermentado (missô). Ovo cozido dura (não-mole).",
});

const SHAKE_DENSO = v({
  label: "Shake denso whey + cacau + banana + pasta amendoim + aveia + leite",
  ingredients: [
    "whey isolado 40g",
    "cacau 100% 1 colher sopa",
    "banana 1 un",
    "pasta de amendoim 100% 1 colher sopa",
    "aveia em flocos 30g",
    "leite integral 350ml",
  ],
  prep_minutes: 3,
  kcal: 620,
  protein_g: 48,
  carbs_g: 60,
  fat_g: 22,
  notes: "Substitui jantar quando precisar líquido. Triptofano (banana + aveia) ajuda sono.",
});

const SNACK_QUEIJO_MACA = v({
  label: "Queijo colonial + maçã fuji + amêndoas",
  ingredients: ["queijo colonial 50g", "maçã fuji 1", "amêndoas 15g"],
  prep_minutes: 1,
  kcal: 320,
  protein_g: 14,
  carbs_g: 28,
  fat_g: 18,
  notes: "Lanche grab-and-go. Quercetina (maçã) anti-asma.",
});

const SNACK_NOTURNO_PROT = v({
  label: "Iogurte natural + cacau 70% + castanha-do-pará + framboesa congelada",
  ingredients: [
    "iogurte natural integral 150g",
    "cacau 70% 20g",
    "castanha-do-pará 2 un",
    "framboesa congelada 60g",
  ],
  prep_minutes: 2,
  kcal: 380,
  protein_g: 14,
  carbs_g: 28,
  fat_g: 22,
  notes: "Triptofano + Mg + selênio + polifenóis. NÃO industrializado. Sono.",
});

const KOMBUCHA_BANANA = v({
  label: "Kombucha + 1 banana",
  ingredients: ["kombucha 300ml", "banana prata 1 un"],
  prep_minutes: 1,
  kcal: 140,
  protein_g: 2,
  carbs_g: 32,
  fat_g: 0,
  notes: "Default sem fome. Hidrata + probiótico + glicose mínima cérebro.",
});

const KOMBUCHA_BANANA_CASTANHA = v({
  label: "Kombucha + banana + 2 castanhas-do-pará",
  ingredients: ["kombucha 300ml", "banana prata 1 un", "castanha-do-pará 2 un"],
  prep_minutes: 1,
  kcal: 220,
  protein_g: 4,
  carbs_g: 33,
  fat_g: 8,
  notes: "Sem fome com Se + Mg. Útil em dia pós-estimulante.",
});

const IOGURTE_MEL = v({
  label: "Iogurte natural + colher de mel",
  ingredients: ["iogurte natural integral 150g", "mel 1 colher chá"],
  prep_minutes: 1,
  kcal: 180,
  protein_g: 8,
  carbs_g: 22,
  fat_g: 6,
  notes: "Sem fome jantar.",
});

const KOMBUCHA_MEL = v({
  label: "Kombucha + colher de mel + canela",
  ingredients: ["kombucha 300ml", "mel 1 colher chá", "canela em pó"],
  prep_minutes: 1,
  kcal: 80,
  protein_g: 0,
  carbs_g: 20,
  fat_g: 0,
  notes: "Sem fome / liquid snack noturno.",
});

// Portions trimmed 2026-09 alongside IOGURTE_GRANOLA — see the note there.
// One slice instead of two; the egg stays (it carries most of the protein).
const PAO_ABACATE = v({
  label: "Pão integral + abacate amassado + limão + sal + ovo cozido",
  ingredients: [
    "pão integral 1 fatia",
    "abacate 1/2",
    "limão 1/2",
    "sal e pimenta",
    "ovo cozido dura 1 un",
  ],
  prep_minutes: 8,
  kcal: 275,
  protein_g: 11,
  carbs_g: 21,
  fat_g: 17,
  notes: "Abacate em pão (aceito). Ovo cozido dura. Sem gema mole.",
});

const BATATA_DOCE_FRANGO = v({
  label: "Frango desfiado + batata-doce laranja + folhas + limão",
  ingredients: [
    "peito de frango desfiado 130g (do batch dominical)",
    "batata-doce laranja 200g",
    "rúcula ou alface 1 maço",
    "azeite 1 colher sopa",
    "limão 1/2",
  ],
  prep_minutes: 5,
  kcal: 540,
  protein_g: 38,
  carbs_g: 55,
  fat_g: 14,
  notes: "Easy: batch já feito, só montar.",
});

// Fallback if current_chicken_phase reverts — same slot, same batch-cook
// pattern, patinho instead of frango (already a favorite protein per his
// profile, so this isn't a stretch substitution).
const BATATA_DOCE_PATINHO = v({
  label: "Patinho desfiado + batata-doce laranja + folhas + limão",
  ingredients: [
    "patinho desfiado 130g (do batch dominical)",
    "batata-doce laranja 200g",
    "rúcula ou alface 1 maço",
    "azeite 1 colher sopa",
    "limão 1/2",
  ],
  prep_minutes: 5,
  kcal: 560,
  protein_g: 40,
  carbs_g: 55,
  fat_g: 16,
  notes: "Fallback pré-pronto se a fase de frango reverter. Easy: batch já feito, só montar.",
});

// The five recipes below come from Dra. Schlindwein's "Organização de
// Hábitos" doc (14/08/2026) — practical lunch/dinner ideas (sopas de
// lentilha, quinoa bowls, "Rap 10" wraps, homus, hambúrguer caseiro) and a
// vegan-shake backup. Wired into specific days below rather than left as
// notes-only, so they're actually part of the served week.
const SOPA_LENTILHA = v({
  label: "Sopa de lentilha com legumes + frango desfiado + cúrcuma",
  ingredients: [
    "lentilha vermelha 150g (seca)",
    "frango desfiado 100g (do batch dominical)",
    "cenoura em cubos 1/2 xícara",
    "cebola roxa 1/4",
    "alho 2 dentes",
    "cúrcuma + pimenta-do-reino a gosto",
    "caldo de legumes caseiro 400ml",
    "limão 1/2",
  ],
  prep_minutes: 15,
  kcal: 580,
  protein_g: 36,
  carbs_g: 58,
  fat_g: 18,
  prep_steps: [
    "Refogue cebola + alho, junte lentilha + caldo, cozinhe até macia (~15min).",
    "Junte frango desfiado + cúrcuma + pimenta, aqueça.",
    "Sirva com limão espremido.",
  ],
  notes: "Sopa de lentilha da nutricionista. Sem tomate.",
});

const BOWL_QUINOA_VEGETARIANO = v({
  label: "Bowl vegetariano: quinoa + grão-de-bico + vegetais assados + homus + ovo cozido",
  ingredients: [
    "quinoa cozida 1 xícara",
    "grão-de-bico cozido 100g",
    "abobrinha em cubos assada 1 xícara",
    "cenoura assada 1/2 xícara",
    "abacate 1/4",
    "homus (grão-de-bico + tahine + limão + azeite) 3 colheres sopa",
    "ovo cozido dura 1 un",
    "limão 1/2",
  ],
  prep_minutes: 15,
  kcal: 620,
  protein_g: 34,
  carbs_g: 62,
  fat_g: 24,
  prep_steps: [
    "Vegetais assados no forno 200°C 20min (pode ser do batch dominical).",
    "Monte a tigela: quinoa, grão-de-bico, vegetais, abacate, ovo cozido.",
    "Cubra com homus e esprema limão.",
  ],
  notes: "Bowl vegetariano da nutricionista (quinoa + homus). Ovo cozido dura, sem gema mole. Sem tomate.",
});

const RAP10_PROTEINA = v({
  label: "Rap 10 com frango ou patinho desfiado + alface + cenoura + homus",
  ingredients: [
    "wrap integral (Rap 10) 1 un",
    "frango ou patinho desfiado 100g (do batch dominical)",
    "alface 1 punhado",
    "cenoura ralada 1/2 xícara",
    "homus 2 colheres sopa",
    "limão 1/4",
  ],
  prep_minutes: 6,
  kcal: 540,
  protein_g: 32,
  carbs_g: 48,
  fat_g: 18,
  prep_steps: ["Espalhe o homus no wrap.", "Monte com proteína desfiada + alface + cenoura.", "Enrole e corte ao meio."],
  notes: "Wrap rápido da nutricionista — usa proteína já desfiada do batch. Sem tomate.",
});

const HAMBURGUER_CASEIRO = v({
  label: "Hambúrguer caseiro (patinho ou frango) + pão integral + abacate + picles",
  ingredients: [
    "patinho moído magro ou peito de frango moído 150g",
    "pão integral de hambúrguer 1 un",
    "abacate em fatias 1/4",
    "alface 2 folhas",
    "cebola roxa em fatias finas 1/4",
    "picles caseiro (sem tomate) a gosto",
    "azeite + sal + pimenta-do-reino",
  ],
  prep_minutes: 18,
  kcal: 680,
  protein_g: 42,
  carbs_g: 62,
  fat_g: 28,
  prep_steps: [
    "Tempere e modele o hambúrguer, grelhe 4min cada lado.",
    "Monte no pão com abacate, alface, cebola roxa e picles.",
  ],
  notes: "Hambúrguer caseiro sugerido pela nutricionista — não é o burger de delivery. Sem tomate.",
});

const SHAKE_VEGANO_RAKKAU = v({
  label: "Shake de proteína vegana (Rakkau) + banana + leite vegetal + pasta de amendoim",
  ingredients: [
    "proteína vegana em pó (Rakkau) 1 dose",
    "banana 1 un",
    "leite vegetal (aveia ou amêndoas) 300ml",
    "pasta de amendoim 100% 1 colher sopa",
  ],
  prep_minutes: 3,
  kcal: 450,
  protein_g: 30,
  carbs_g: 45,
  fat_g: 14,
  prep_steps: ["Tudo no liquidificador 60s."],
  notes: "Opção backup vegana sugerida pela nutricionista — não substitui o smoothie de manga (receita signature dele).",
});

const MARMITA_BATCH = v({
  label: "Marmita do batch (esquentar 2min) + salada montada + limão",
  ingredients: [
    "marmita batch (proteína + carbo + vegetal já porcionados)",
    "folhas verdes lavadas",
    "azeite + limão",
  ],
  prep_minutes: 3,
  kcal: 580,
  protein_g: 38,
  carbs_g: 55,
  fat_g: 18,
  notes: "Default easy de almoço/jantar. Anti-burger.",
});

const PRE_SKATE_FUEL = v({
  label: "Cuscuz + banana + mel + pasta de amendoim + tâmara",
  ingredients: [
    "cuscuz marroquino integral 60g (seco, hidratado)",
    "banana 1 un",
    "mel 1 colher sopa",
    "pasta de amendoim 1 colher sopa",
    "tâmara 2 un",
  ],
  prep_minutes: 8,
  kcal: 500,
  protein_g: 12,
  carbs_g: 85,
  fat_g: 12,
  prep_steps: ["Hidrate cuscuz 5min água quente.", "Misture tudo numa tigela."],
  notes: "Pré-skate 60-90min antes. Carbs mistos rápido+lento.",
});

const POS_SKATE_RECOVERY = v({
  label: "Whey + arroz branco com sal + mel + banana (janela glicogênio)",
  ingredients: [
    "whey isolado 30g + 250ml água",
    "arroz branco cozido 150g",
    "sal pitada",
    "mel 1 colher sopa",
    "banana 1 un",
  ],
  prep_minutes: 4,
  kcal: 520,
  protein_g: 30,
  carbs_g: 80,
  fat_g: 4,
  notes: "Até 30min pós-skate. Carbo simples + proteína rápida.",
});

const ELETROLITO_CASEIRO = v({
  label: "Água + mel + sal + limão (isotônico caseiro)",
  ingredients: ["água 500ml", "mel 1 colher sopa", "sal pitada", "limão 1/2"],
  prep_minutes: 1,
  kcal: 80,
  protein_g: 0,
  carbs_g: 18,
  fat_g: 0,
  notes: "Pré-skate eletrólito. Anti-vasovagal.",
});

// ─── Targets ──────────────────────────────────────────────────────────────────

// Exported so meal-plan-ai.ts's prompt text can cite these same numbers
// instead of carrying its own hardcoded duplicate that could silently
// drift out of sync.
export const SKATE_DAY = {
  kcal_target: 3300,
  protein_g_target: 130,
  carb_g_target: 390,
  fat_g_target: 95,
};

export const NORMAL_DAY = {
  kcal_target: 2500,
  protein_g_target: 130,
  carb_g_target: 225,
  fat_g_target: 90,
};

// ─── Schedule builder ─────────────────────────────────────────────────────────

function card(slot: MealSlot, time: string, original: MealVersion, easy?: MealVersion, liquid?: MealVersion, no_hunger?: MealVersion): MealCard {
  return {
    slot,
    scheduled_time: time,
    alternatives: {
      original,
      easy: easy ?? IOGURTE_GRANOLA,
      liquid: liquid ?? SHAKE_MANGA,
      no_hunger: no_hunger ?? KOMBUCHA_BANANA,
    },
  };
}

// ─── Weekly plan (Sunday-anchored) ────────────────────────────────────────────

export function buildWeeklyPlan(weekStartIso: string): DailyPlan[] {
  const dates = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));

  return [
    /* SUNDAY — skate hard day, off work, batch-cook session */
    {
      date: dates[0],
      day_of_week: "Domingo",
      is_skate_day: true,
      is_work_day: false,
      ...SKATE_DAY,
      meals: [
        // Sunday/Saturday originals are boosted here (kcal/carb only, via
        // per-day overrides — the shared consts below stay untouched since
        // they're reused as-is on work days) to actually hit the 3300kcal/
        // 390g-carb skate-day target: the un-boosted originals summed to
        // only ~2740 kcal / ~310g carb, underfueling the one day with the
        // highest glycogen/electrolyte demand and the documented syncope
        // risk — the opposite of what a hard-training day needs. (Skate
        // anchor moved from Sun/Mon to Sat/Sun in 2026-09 when work moved
        // to Mon-Fri — see the SATURDAY block below.)
        card("cafe_da_manha", "07:30",
          v({ ...PRE_SKATE_FUEL, label: "Pré-skate: " + PRE_SKATE_FUEL.label, kcal: 600, carbs_g: 110, ingredients: [...PRE_SKATE_FUEL.ingredients, "banana extra 1 un"] }),
          IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30",
          ELETROLITO_CASEIRO,
          v({ label: "Banana + tâmara durante skate", ingredients: ["banana 1", "tâmara 2"], prep_minutes: 1, kcal: 200, protein_g: 2, carbs_g: 50, fat_g: 0 }),
          ELETROLITO_CASEIRO, KOMBUCHA_BANANA),
        card("almoco", "13:00",
          v({ ...POS_SKATE_RECOVERY, kcal: 640, carbs_g: 110, ingredients: [...POS_SKATE_RECOVERY.ingredients, "arroz branco extra 100g"] }),
          MARMITA_BATCH, SHAKE_DENSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00",
          v({ ...PATINHO_QUINOA, kcal: 720, carbs_g: 90, ingredients: [...PATINHO_QUINOA.ingredients, "quinoa extra 1/2 xícara"] }),
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("jantar", "20:00",
          v({ ...SALMAO_BATATA, kcal: 830, carbs_g: 85, fat_g: 34, ingredients: [...SALMAO_BATATA.ingredients, "batata-doce roxa extra 100g"] }),
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30",
          SNACK_NOTURNO_PROT,
          SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* MONDAY — work day, no skate (schedule changed 2026-09: work moved to Mon-Fri, skate anchor moved to Sat/Sun) */
    {
      date: dates[1],
      day_of_week: "Segunda",
      is_skate_day: false,
      is_work_day: true,
      ...NORMAL_DAY,
      meals: [
        card("cafe_da_manha", "07:30", SHAKE_MANGA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_VEGANO_RAKKAU, KOMBUCHA_BANANA_CASTANHA),
        card("almoco", "12:30", LINGUADO_KIMCHI, MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", ROBALO_AIPIM, MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* TUESDAY — work day, no skate */
    {
      date: dates[2],
      day_of_week: "Terça",
      is_skate_day: false,
      is_work_day: true,
      ...NORMAL_DAY,
      meals: [
        card("cafe_da_manha", "07:30", SHAKE_MANGA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("almoco", "12:30", SOPA_LENTILHA, MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", LINGUADO_KIMCHI, RAP10_PROTEINA, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* WEDNESDAY — work + possible stimulant use day → next day will need recovery */
    {
      date: dates[3],
      day_of_week: "Quarta",
      is_skate_day: false,
      is_work_day: true,
      ...NORMAL_DAY,
      meals: [
        card("cafe_da_manha", "07:30", SHAKE_MANGA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("almoco", "12:30", FRANGO_CURRY, MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", BOWL_QUINOA_VEGETARIANO, BOWL_QUINOA_VEGETARIANO, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* THURSDAY — work, possibly post-stimulant recovery */
    {
      date: dates[4],
      day_of_week: "Quinta",
      is_skate_day: false,
      is_work_day: true,
      ...NORMAL_DAY,
      meals: [
        card("cafe_da_manha", "07:30",
          v({ ...SHAKE_MANGA, label: "Shake recovery: manga + gengibre + limão + whey + linhaça + cacau", kcal: 510, protein_g: 36 }),
          IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_VEGANO_RAKKAU, KOMBUCHA_BANANA_CASTANHA),
        card("almoco", "12:30",
          v({ ...PATINHO_QUINOA, label: "Recovery: " + PATINHO_QUINOA.label, notes: "Tirosina + Mg + B6. Pós-estimulante." }),
          MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", SALMAO_BATATA, MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* FRIDAY — work, possible stimulant use, jantar fora reserved */
    {
      date: dates[5],
      day_of_week: "Sexta",
      is_skate_day: false,
      is_work_day: true,
      ...NORMAL_DAY,
      meals: [
        card("cafe_da_manha", "07:30", SHAKE_MANGA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("almoco", "12:30", POKE_ATUM, MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00",
          HAMBURGUER_CASEIRO,
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* SATURDAY — skate hard day, off work (schedule changed 2026-09: skate anchor moved from Sun/Mon to Sat/Sun) */
    {
      date: dates[6],
      day_of_week: "Sábado",
      is_skate_day: true,
      is_work_day: false,
      ...SKATE_DAY,
      meals: [
        card("cafe_da_manha", "07:30",
          v({ ...PRE_SKATE_FUEL, kcal: 600, carbs_g: 110, ingredients: [...PRE_SKATE_FUEL.ingredients, "banana extra 1 un"] }),
          IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30",
          ELETROLITO_CASEIRO,
          v({ label: "Banana + tâmara", ingredients: ["banana 1", "tâmara 2"], prep_minutes: 1, kcal: 200, protein_g: 2, carbs_g: 50, fat_g: 0 }),
          ELETROLITO_CASEIRO, KOMBUCHA_BANANA),
        card("almoco", "13:00",
          v({ ...POS_SKATE_RECOVERY, kcal: 640, carbs_g: 110, ingredients: [...POS_SKATE_RECOVERY.ingredients, "arroz branco extra 100g"] }),
          MARMITA_BATCH, SHAKE_DENSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00",
          v({ ...FRANGO_CURRY, kcal: 760, carbs_g: 90, fat_g: 25, ingredients: [...FRANGO_CURRY.ingredients, "cuscuz extra 40g"] }),
          BATATA_DOCE_FRANGO, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00",
          v({ ...ROBALO_AIPIM, kcal: 750, carbs_g: 90, fat_g: 22, ingredients: [...ROBALO_AIPIM.ingredients, "aipim extra 100g"] }),
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
  ];
}

// ─── Generic starter seed (any profile without a hand-authored week) ──────────

const GENERIC_DOW_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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

// Used only when nutrition_targets is still the literal "FILL_IN" placeholder
// (a profile nobody has filled in yet — see profile.ts) — modest, clearly
// generic adult-recomp numbers so the starter plan below renders usable
// kcal/protein figures instead of "NaN kcal" on every meal card. Not meant
// as a real recommendation; every generated meal already carries a "starter
// template" note pointing at generating an AI plan to personalize.
const GENERIC_FALLBACK_KCAL = 2200;
const GENERIC_FALLBACK_PROTEIN = 100;

export function buildGenericSeedPlan(weekStartIso: string, profile: PersonProfile): DailyPlan[] {
  const rawKcal = profile.nutrition_targets.total_kcal_target_off_day;
  const rawProtein = profile.nutrition_targets.protein_g_per_day;
  const kcalTarget = typeof rawKcal === "number" && rawKcal > 0 ? rawKcal : GENERIC_FALLBACK_KCAL;
  const proteinTarget = typeof rawProtein === "number" && rawProtein > 0 ? rawProtein : GENERIC_FALLBACK_PROTEIN;

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysIso(weekStartIso, i);

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
      day_of_week: GENERIC_DOW_NAMES[dowForIso(date)],
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

// ─── Plan resolution (DB-backed > hand-crafted seed) ──────────────────────────

export interface ResolvedWeeklyPlan {
  days: DailyPlan[];
  source: "seed" | "ai";
  generated_at?: string;
}

// A stored plan is JSON written by the AI generator, so it can be malformed in
// ways an `Array.isArray(x) && x.length === 7` check sails straight past: a day
// missing `kcal_target` made the home page compute `undefined + bonus` and
// render a NaN ring, and a day missing `meals` threw inside the meal list.
// Validate the shape the UI actually depends on before trusting it, and fall
// back to the deterministic seed plan (loudly) when it doesn't hold.
export function isUsableWeek(days: unknown, weekStartIso: string): days is DailyPlan[] {
  if (!Array.isArray(days) || days.length !== 7) return false;
  const shapeOk = days.every((d) => {
    if (!d || typeof d !== "object") return false;
    const day = d as Partial<DailyPlan>;
    return (
      typeof day.date === "string" &&
      typeof day.kcal_target === "number" &&
      Number.isFinite(day.kcal_target) &&
      typeof day.protein_g_target === "number" &&
      Number.isFinite(day.protein_g_target) &&
      typeof day.day_of_week === "string" &&
      Array.isArray(day.meals) &&
      day.meals.length > 0 &&
      day.meals.every((m) => m && typeof m.slot === "string" && m.alternatives?.original)
    );
  });
  if (!shapeOk) return false;
  // Checked as a SET of the 7 expected dates, not positional equality — the
  // AI generator's JSON schema only requires `date` to be a string and never
  // sorts what it stores, so a legitimate plan with days out of array order
  // used to fail this check and silently fall back to the generic seed plan.
  // Every real consumer (page.tsx, getDayKcalTarget, plan/page.tsx) already
  // looks a day up by `.find(d => d.date === ...)`, never by index, so
  // ordering was never something the app actually depended on.
  const expected = new Set(Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i)));
  const actual = new Set((days as DailyPlan[]).map((d) => d.date));
  return actual.size === 7 && [...expected].every((date) => actual.has(date));
}

export async function resolveWeeklyPlan(personId: PersonId, weekStartIso: string): Promise<ResolvedWeeklyPlan> {
  const stored = await getStoredWeeklyPlan(personId, weekStartIso);
  if (stored) {
    try {
      const days = JSON.parse(stored.plan_json) as DailyPlan[];
      if (isUsableWeek(days, weekStartIso)) {
        return { days, source: stored.source, generated_at: stored.generated_at };
      }
      console.error(
        `[seed-plan] stored plan for ${personId}/${weekStartIso} failed validation; falling back to seed`
      );
    } catch {
      // Fall through to seed
    }
  }
  const profile = loadProfile(personId);
  if (profile.has_custom_meal_plan) {
    return { days: buildWeeklyPlan(weekStartIso), source: "seed" };
  }
  return { days: buildGenericSeedPlan(weekStartIso, profile), source: "seed" };
}

// What a given date's plan actually budgeted for kcal — the same number
// the home page shows if you navigate to that date — rather than assuming
// every day was an "off day". Skate days budget for meaningfully more, and
// skate days aren't fixed weekdays (weather-opportunistic), so trend code
// comparing logged intake against a flat number reads a correctly-fueled
// skate day as overeating. resolveWeeklyPlan is a cheap DB read/local
// computation (no network call), so calling this once per date is fine.
// Falls back to the flat off-day target only if that date's plan can't be
// resolved at all.
export async function getDayKcalTarget(
  personId: PersonId,
  dateIso: string,
  fallbackNormal: number
): Promise<number> {
  try {
    const resolved = await resolveWeeklyPlan(personId, getSundayOfWeek(dateIso));
    const day = resolved.days.find((d) => d.date === dateIso);
    if (day && typeof day.kcal_target === "number" && day.kcal_target > 0) {
      return day.kcal_target;
    }
  } catch {
    // fall through to the flat fallback below
  }
  return fallbackNormal;
}

// ─── Shopping list (derived from week plan) ───────────────────────────────────

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  estimated_weight_kg: number;
  route: "self_carry" | "delivery";
  store_suggestion: "forte_mensal" | "imperatriz_semanal" | "imperatriz_topup" | "ifood";
}

export function buildShoppingList(): { delivery: ShoppingItem[]; self_carry: ShoppingItem[] } {
  const all: ShoppingItem[] = [
    /* ── Proteínas (Imperatriz semanal, refrigerada) ── */
    { name: "Patinho moído magro", quantity: "1 kg", category: "Proteína", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Peito de frango", quantity: "1.5 kg", category: "Proteína", estimated_weight_kg: 1.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Filé de salmão fresco", quantity: "500 g (2 porções 250g)", category: "Proteína", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Atum fresco em posta", quantity: "300 g", category: "Proteína", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Filé de linguado", quantity: "400 g", category: "Proteína", estimated_weight_kg: 0.4, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Filé de robalo", quantity: "400 g", category: "Proteína", estimated_weight_kg: 0.4, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Ovos caipira", quantity: "30 un", category: "Proteína", estimated_weight_kg: 1.8, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Tofu firme", quantity: "300 g", category: "Proteína", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Carbs ── */
    { name: "Arroz integral", quantity: "5 kg", category: "Carbo", estimated_weight_kg: 5.0, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Arroz preto", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Arroz japonês para poke", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Quinoa", quantity: "500 g", category: "Carbo", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Cuscuz marroquino integral", quantity: "500 g", category: "Carbo", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Aipim em pedaços", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Batata-doce roxa", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Batata-doce laranja", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Macarrão integral grano duro", quantity: "500 g x 2", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Macarrão de grão-de-bico", quantity: "400 g", category: "Carbo", estimated_weight_kg: 0.4, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Aveia em flocos grossos", quantity: "1 kg", category: "Carbo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Pão integral 100% grão de forma", quantity: "1 un", category: "Carbo", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Leguminosas ── */
    { name: "Lentilha vermelha", quantity: "500 g", category: "Leguminosa", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Grão-de-bico", quantity: "500 g", category: "Leguminosa", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Feijão branco grande", quantity: "500 g", category: "Leguminosa", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },

    /* ── Hortifrúti ── */
    { name: "Brócolis ninja", quantity: "2 maços", category: "Vegetal", estimated_weight_kg: 0.6, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Abobrinha", quantity: "4 un", category: "Vegetal", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Cenoura", quantity: "1 kg", category: "Vegetal", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Rúcula", quantity: "2 maços", category: "Vegetal", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Alface", quantity: "1 pé", category: "Vegetal", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Couve manteiga", quantity: "1 maço", category: "Vegetal", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Espinafre", quantity: "1 maço", category: "Vegetal", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Repolho roxo", quantity: "1 un", category: "Vegetal", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Cebola roxa", quantity: "1 kg", category: "Vegetal", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Alho roxo", quantity: "200 g", category: "Vegetal", estimated_weight_kg: 0.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Gengibre fresco", quantity: "200 g", category: "Vegetal", estimated_weight_kg: 0.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Pimentão amarelo", quantity: "3 un", category: "Vegetal", estimated_weight_kg: 0.6, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Pepino japonês", quantity: "3 un", category: "Vegetal", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Cogumelo shitake fresco", quantity: "300 g", category: "Vegetal", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Cogumelo paris fresco", quantity: "300 g", category: "Vegetal", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Frutas ── */
    { name: "Banana prata", quantity: "1.5 kg", category: "Fruta", estimated_weight_kg: 1.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Manga", quantity: "5 un", category: "Fruta", estimated_weight_kg: 1.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Maçã fuji", quantity: "1.5 kg", category: "Fruta", estimated_weight_kg: 1.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Limão tahiti", quantity: "1 kg", category: "Fruta", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Morango", quantity: "500 g", category: "Fruta", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Framboesa congelada", quantity: "300 g", category: "Fruta", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Abacate", quantity: "3 un", category: "Fruta", estimated_weight_kg: 0.8, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Tâmara medjool", quantity: "300 g", category: "Fruta", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Laticínios ── */
    { name: "Iogurte natural integral 1L", quantity: "3 un", category: "Laticínio", estimated_weight_kg: 3.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Leite integral 1L", quantity: "6 un", category: "Laticínio", estimated_weight_kg: 6.0, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Queijo colonial em peça", quantity: "300 g", category: "Laticínio", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Manteiga ghee", quantity: "1 pote 200g", category: "Laticínio", estimated_weight_kg: 0.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Gorduras + óleos ── */
    { name: "Azeite extra virgem", quantity: "1 L", category: "Óleo", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Pasta de amendoim 100%", quantity: "500 g", category: "Óleo", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },

    /* ── Castanhas + sementes ── */
    { name: "Castanha-do-pará", quantity: "300 g", category: "Castanha", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Amêndoas torradas sem sal", quantity: "500 g", category: "Castanha", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Linhaça dourada", quantity: "500 g", category: "Castanha", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Sementes de abóbora cruas", quantity: "300 g", category: "Castanha", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "forte_mensal" },

    /* ── Fermentados ── */
    { name: "Kimchi pote", quantity: "1 pote 400g", category: "Fermentado", estimated_weight_kg: 0.4, route: "self_carry", store_suggestion: "ifood" },
    { name: "Chucrute artesanal pote", quantity: "1 pote 400g", category: "Fermentado", estimated_weight_kg: 0.4, route: "self_carry", store_suggestion: "ifood" },
    { name: "Kombucha sem açúcar", quantity: "6 un 500ml", category: "Fermentado", estimated_weight_kg: 3.0, route: "delivery", store_suggestion: "imperatriz_semanal" },
    { name: "Missô em pasta", quantity: "1 pote", category: "Fermentado", estimated_weight_kg: 0.3, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Temperos + funcionais ── */
    { name: "Cúrcuma em pó", quantity: "100 g", category: "Tempero", estimated_weight_kg: 0.1, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Pimenta-do-reino preta em grão", quantity: "100 g", category: "Tempero", estimated_weight_kg: 0.1, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Cacau 70% em barra", quantity: "200 g", category: "Tempero", estimated_weight_kg: 0.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Cacau 100% em pó", quantity: "200 g", category: "Tempero", estimated_weight_kg: 0.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Mel silvestre puro", quantity: "500 g", category: "Tempero", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "forte_mensal" },
    { name: "Shoyu tradicional baixo sódio", quantity: "1 garrafa 500ml", category: "Tempero", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Gergelim torrado", quantity: "200 g", category: "Tempero", estimated_weight_kg: 0.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Sal grosso integral", quantity: "1 kg", category: "Tempero", estimated_weight_kg: 1.0, route: "self_carry", store_suggestion: "forte_mensal" },

    /* ── Suplemento + recovery ── */
    { name: "Whey protein isolado neutro", quantity: "900 g", category: "Suplemento", estimated_weight_kg: 0.9, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Granola sem açúcar", quantity: "500 g", category: "Suplemento", estimated_weight_kg: 0.5, route: "self_carry", store_suggestion: "imperatriz_semanal" },
    { name: "Água de coco natural", quantity: "6 un 200ml", category: "Bebida", estimated_weight_kg: 1.2, route: "self_carry", store_suggestion: "imperatriz_semanal" },

    /* ── Itens muito pesados → delivery ── */
    { name: "Água mineral galão 20L", quantity: "1 un", category: "Bebida", estimated_weight_kg: 20.0, route: "delivery", store_suggestion: "ifood" },
  ];

  return {
    delivery: all.filter((i) => i.route === "delivery"),
    self_carry: all.filter((i) => i.route === "self_carry"),
  };
}
