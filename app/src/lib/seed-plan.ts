import type { DailyPlan, MealCard, MealVersion, MealSlot } from "./types";

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

const IOGURTE_GRANOLA = v({
  label: "Iogurte natural + granola + frutas vermelhas + castanha-do-pará + mel",
  ingredients: [
    "iogurte natural integral 200g",
    "granola sem açúcar 40g",
    "morango ou framboesa 100g",
    "castanha-do-pará 2 un",
    "mel 1 colher chá",
  ],
  prep_minutes: 2,
  kcal: 520,
  protein_g: 18,
  carbs_g: 60,
  fat_g: 22,
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
  notes: "Sem fome com Se + Mg. Útil em dia pós-coca.",
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

const PAO_ABACATE = v({
  label: "Pão integral + abacate amassado + limão + sal + ovo cozido",
  ingredients: [
    "pão integral 2 fatias",
    "abacate 1/2",
    "limão 1/2",
    "sal e pimenta",
    "ovo cozido dura 1 un",
  ],
  prep_minutes: 8,
  kcal: 480,
  protein_g: 18,
  carbs_g: 42,
  fat_g: 26,
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

const SKATE_DAY = {
  kcal_target: 3300,
  protein_g_target: 130,
  carb_g_target: 390,
  fat_g_target: 95,
};

const NORMAL_DAY = {
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
  const base = new Date(weekStartIso + "T00:00:00");
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return [
    /* SUNDAY — skate hard day, off work, batch-cook session */
    {
      date: dates[0],
      day_of_week: "Domingo",
      is_skate_day: true,
      is_work_day: false,
      ...SKATE_DAY,
      meals: [
        card("cafe_da_manha", "07:30",
          v({ ...PRE_SKATE_FUEL, label: "Pré-skate: " + PRE_SKATE_FUEL.label }),
          IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30",
          ELETROLITO_CASEIRO,
          v({ label: "Banana + tâmara durante skate", ingredients: ["banana 1", "tâmara 2"], prep_minutes: 1, kcal: 200, protein_g: 2, carbs_g: 50, fat_g: 0 }),
          ELETROLITO_CASEIRO, KOMBUCHA_BANANA),
        card("almoco", "13:00",
          POS_SKATE_RECOVERY,
          MARMITA_BATCH, SHAKE_DENSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00",
          PATINHO_QUINOA,
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("jantar", "20:00",
          SALMAO_BATATA,
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30",
          SNACK_NOTURNO_PROT,
          SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* MONDAY — skate hard day, off work */
    {
      date: dates[1],
      day_of_week: "Segunda",
      is_skate_day: true,
      is_work_day: false,
      ...SKATE_DAY,
      meals: [
        card("cafe_da_manha", "07:30", PRE_SKATE_FUEL, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA),
        card("lanche_manha", "10:30",
          ELETROLITO_CASEIRO,
          v({ label: "Banana + tâmara", ingredients: ["banana 1", "tâmara 2"], prep_minutes: 1, kcal: 200, protein_g: 2, carbs_g: 50, fat_g: 0 }),
          ELETROLITO_CASEIRO, KOMBUCHA_BANANA),
        card("almoco", "13:00", POS_SKATE_RECOVERY, MARMITA_BATCH, SHAKE_DENSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", FRANGO_CURRY, BATATA_DOCE_FRANGO, SHAKE_MANGA, IOGURTE_MEL),
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
        card("almoco", "12:30", PATINHO_QUINOA, MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", LINGUADO_KIMCHI, MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* WEDNESDAY — work + possible coca use day → next day will need recovery */
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
        card("jantar", "20:00", POKE_ATUM, POKE_ATUM, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* THURSDAY — work, possibly post-coca recovery */
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
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA_CASTANHA),
        card("almoco", "12:30",
          v({ ...PATINHO_QUINOA, label: "Recovery: " + PATINHO_QUINOA.label, notes: "Tirosina + Mg + B6. Pós-coca." }),
          MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00", PAO_ABACATE, SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", SALMAO_BATATA, MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* FRIDAY — work, possible coca, jantar fora reserved */
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
          v({ label: "Jantar fora (slot reservado) — escolha poke/sushi/peruano/japonês", ingredients: [], prep_minutes: 0, kcal: 700, protein_g: 40, carbs_g: 70, fat_g: 25, notes: "Delivery aceitável OK. Sem tomate, sem burger." }),
          MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
    /* SATURDAY — work, possibly post-coca recovery */
    {
      date: dates[6],
      day_of_week: "Sábado",
      is_skate_day: false,
      is_work_day: true,
      ...NORMAL_DAY,
      meals: [
        card("cafe_da_manha", "07:30",
          v({ ...SHAKE_MANGA, label: "Shake recovery sat: manga + gengibre + limão + whey + linhaça + cacau" }),
          IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_manha", "10:30", IOGURTE_GRANOLA, IOGURTE_GRANOLA, SHAKE_MANGA, KOMBUCHA_BANANA_CASTANHA),
        card("almoco", "12:30", LINGUADO_KIMCHI, MARMITA_BATCH, SOPA_MISSO, KOMBUCHA_BANANA_CASTANHA),
        card("lanche_tarde", "16:00",
          v({ label: "Pré-skate prep sábado: hidratação + Mg + leve", ingredients: ["água 500ml", "limão", "castanha-do-pará 2", "amêndoas 10g"], prep_minutes: 1, kcal: 180, protein_g: 4, carbs_g: 6, fat_g: 16 }),
          SNACK_QUEIJO_MACA, SHAKE_MANGA, IOGURTE_MEL),
        card("jantar", "20:00", ROBALO_AIPIM, MARMITA_BATCH, SHAKE_DENSO, IOGURTE_MEL),
        card("snack_noturno", "22:30", SNACK_NOTURNO_PROT, SNACK_QUEIJO_MACA, KOMBUCHA_MEL, KOMBUCHA_MEL),
      ],
    },
  ];
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
