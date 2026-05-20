import type { CardState, MealSlot } from "./types";

export type Lang = "pt" | "en";

interface Dict {
  app_name: string;
  nav: { today: string; shopping: string; profile: string; history: string; plan: string; analyst: string };
  today: string;
  yesterday: string;
  tomorrow: string;
  prev_day: string;
  next_day: string;
  jump_to_today: string;
  sleep_on_wake: string;
  prep_time_today: string;
  house_fatigue: string;
  house_fatigue_btn: string;
  house_fatigue_active_note: string;
  clear: string;
  substance_log: string;
  logged_today: string;
  tap_to_remove: string;
  skate_day: string;
  recovery: string;
  kcal: string;
  protein: string;
  state: Record<CardState, string>;
  state_desc: Record<CardState, string>;
  slots: Record<MealSlot, string>;
  ate_this: string;
  update_version: string;
  undo: string;
  logging: string;
  updating: string;
  saving: string;
  logged: string;
  min_prep: string;
  show_ingredients: (n: number) => string;
  hide_ingredients: string;
  edit_or_other: string;
  cancel: string;
  save: string;
  custom_label: string;
  custom_kcal: string;
  custom_protein: string;
  custom_hint: string;
  sub: { cocaine: string; alcohol: string; cannabis: string; tobacco: string; benzo: string };
  carbs: string;
  fat: string;
  toggle_lang: string;
  beverages: string;
  beverage: { mate: string; coffee: string; tea: string; treat: string };
  amount_placeholder: (type: string) => string;
  add: string;
  last_mate: string;
  last_coffee: string;
  none_yet: string;
  consumed_at_label: string;
  estimate_with_ai: string;
  estimating: string;
  ai_not_configured: string;
  ai_estimate_failed: string;
  ai_confidence: { low: string; medium: string; high: string };
  shopping_title: string;
  shopping_subtitle: (selfKg: string, trips: number, deliveryKg: string) => string;
  shopping_delivery: string;
  shopping_delivery_empty: string;
  shopping_self_carry: string;
  shopping_rules_title: string;
  shopping_rules: string[];
  store_label: { forte_mensal: string; imperatriz_semanal: string; imperatriz_topup: string; ifood: string };
  profile_age: string;
  profile_height: string;
  profile_weight: string;
  profile_bodyfat: string;
  profile_bmr: string;
  profile_goal: string;
  profile_targets: string;
  profile_target_protein: string;
  profile_target_hydration: string;
  profile_target_kcal_off: string;
  profile_target_kcal_skate: string;
  profile_restrictions: string;
  profile_hard_no: string;
  profile_textures: string;
  profile_dislikes: string;
  profile_medical_flags: string;
  history_title: (n: number) => string;
  history_empty: string;
  history_kcal_protein: (kcal: number, prot: number, n: number) => string;
  notifications: string;
  notifications_enable: string;
  notifications_enabled: string;
  notifications_denied: string;
  notifications_unsupported: string;
  notification_title: (slot: string) => string;
  notification_body: (label: string, time: string) => string;
  predictions_title: string;
  predictions_no_data: string;
  predictions_avg_summary: (kcal: number, protein: number, days: number) => string;
  predictions_adjustments_title: string;
  predictions_protein_boost: (g: number) => string;
  predictions_kcal_boost: (kcal: number) => string;
  predictions_hydration_extra: (l: number) => string;
  insight: {
    protein_deficit: (pct: number, boost: number) => string;
    kcal_deficit: (pct: number, boost: number) => string;
    kcal_surplus: (pct: number) => string;
    missed_meals: (count: number) => string;
    easy_streak: (days: number) => string;
    fatigue_streak: (days: number) => string;
    post_substance: string;
    post_alcohol: string;
    sleep_short: (hours: number) => string;
    sleep_long: (hours: number) => string;
    on_track: string;
  };
  plan_title: string;
  plan_intro: string;
  plan_source_seed: string;
  plan_source_ai: (when: string) => string;
  plan_source_fallback: string;
  plan_generate_button: string;
  plan_generating: string;
  plan_regenerate_button: string;
  plan_clear_button: string;
  plan_ai_disabled: string;
  plan_generation_failed: (msg: string) => string;
  plan_week_starting: (date: string) => string;
  plan_next_week_button: string;
  plan_prev_week_button: string;
  plan_this_week_button: string;
  plan_day_summary: (kcal: number, protein: number, meals: number) => string;
  analyst_title: string;
  analyst_intro: string;
  analyst_window_7: string;
  analyst_window_14: string;
  analyst_window_30: string;
  analyst_no_data: string;
  analyst_days_with_data: (n: number, window: number) => string;
  analyst_section_macros_by_dow: string;
  analyst_section_missed_slots: string;
  analyst_section_state_distribution: string;
  analyst_section_correlations: string;
  analyst_section_insights: string;
  analyst_dow_short: { sun: string; mon: string; tue: string; wed: string; thu: string; fri: string; sat: string };
  analyst_correlation_sleep: (low: number, high: number) => string;
  analyst_correlation_substance: (kcal: number) => string;
  analyst_max_easy_streak: (days: number) => string;
  analyst_fatigue_days: (days: number) => string;
  habit_insight: {
    chronic_protein_deficit: (avg: number, target: number) => string;
    chronic_kcal_deficit: (avg: number, target: number) => string;
    most_missed_slot: (slot: string, count: number) => string;
    weekend_heavier: (delta: number) => string;
    workday_lighter: (delta: number) => string;
    sleep_short_pattern: (count: number) => string;
    on_track: string;
  };
}

const pt: Dict = {
  app_name: "Plano A",
  nav: { today: "Hoje", shopping: "Compras", profile: "Perfil", history: "Histórico", plan: "Plano", analyst: "Padrões" },
  today: "Hoje",
  yesterday: "Ontem",
  tomorrow: "Amanhã",
  prev_day: "Dia anterior",
  next_day: "Próximo dia",
  jump_to_today: "Hoje",
  sleep_on_wake: "Sono ao acordar",
  prep_time_today: "Tempo de prep hoje",
  house_fatigue: "Cansaço de casa",
  house_fatigue_btn: "Tô cansado da casa",
  house_fatigue_active_note: "Defaults dos cards setados pra Fácil. Delivery aceitável: poke / sushi / peruano / japonês.",
  clear: "Limpar",
  substance_log: "Log de substância",
  logged_today: "Logado neste dia",
  tap_to_remove: "Toque pra remover",
  skate_day: "Skate day",
  recovery: "Recovery",
  kcal: "Kcal",
  protein: "Proteína",
  state: {
    original: "Original",
    easy: "Fácil",
    liquid: "Líquido",
    no_hunger: "Sem fome",
  },
  state_desc: {
    original: "Refeição completa planejada",
    easy: "Pegar e comer, sem cozinhar",
    liquid: "Smoothie, shake ou sopa",
    no_hunger: "Mínimo pra não quebrar a cadeia",
  },
  slots: {
    cafe_da_manha: "Café da manhã",
    lanche_manha: "Lanche da manhã",
    almoco: "Almoço",
    lanche_tarde: "Lanche da tarde",
    jantar: "Jantar",
    snack_noturno: "Snack noturno",
  },
  ate_this: "Comi isso",
  update_version: "Atualizar versão",
  undo: "Desfazer",
  logging: "Logando…",
  updating: "Atualizando…",
  saving: "Salvando…",
  logged: "Logado",
  min_prep: "min prep",
  show_ingredients: (n) => `Ver ${n} ingrediente${n === 1 ? "" : "s"}`,
  hide_ingredients: "Esconder ingredientes",
  edit_or_other: "Editar / comi outra coisa",
  cancel: "Cancelar",
  save: "Salvar",
  custom_label: "O que comi (texto livre)",
  custom_kcal: "kcal (opcional)",
  custom_protein: "proteína em g (opcional)",
  custom_hint: "Substitui a sugestão. Deixa kcal/proteína em branco se não souber.",
  sub: { cocaine: "coca", alcohol: "álcool", cannabis: "cannabis", tobacco: "tabaco", benzo: "benzo" },
  carbs: "C",
  fat: "G",
  toggle_lang: "EN",
  beverages: "Bebidas (mate / café / chá / treats)",
  beverage: { mate: "mate", coffee: "café", tea: "chá", treat: "treat" },
  amount_placeholder: (type) => {
    if (type === "mate") return "ex: 1 cuia / 500ml";
    if (type === "coffee") return "ex: 1 espresso / 200ml";
    if (type === "tea") return "ex: 1 xícara";
    return "ex: chocolate, sorvete";
  },
  add: "Adicionar",
  last_mate: "Última cuia de mate",
  last_coffee: "Último café",
  none_yet: "nenhum hoje",
  consumed_at_label: "Horário (HH:MM)",
  estimate_with_ai: "Estimar nutrição com IA",
  estimating: "Estimando…",
  ai_not_configured: "IA não configurada (falta ANTHROPIC_API_KEY)",
  ai_estimate_failed: "Erro ao estimar. Preenche manualmente.",
  ai_confidence: { low: "confiança baixa", medium: "confiança média", high: "confiança alta" },
  shopping_title: "Lista de compras da semana",
  shopping_subtitle: (selfKg, trips, deliveryKg) => `Total subir: ${selfKg} kg (${trips} viagem${trips === 1 ? "" : "ns"} × 20kg max). Total delivery: ${deliveryKg} kg.`,
  shopping_delivery: "🚚 Delivery (entregue na porta)",
  shopping_delivery_empty: "Nenhum item pesado o suficiente pra delivery obrigatório esta semana.",
  shopping_self_carry: "🚶 Subir",
  shopping_rules_title: "Regras aplicadas:",
  shopping_rules: [
    "Cap por subida: 20 kg (2 pessoas × 2 viagens = até 80 kg/sessão)",
    "Itens individuais > 5 kg: tag delivery preferred",
    "Forte mensal: shelf-stable bulk (óleos, grãos secos, mel, castanhas, café)",
    "Imperatriz semanal: frescos (proteínas, hortifrúti, lácteos, congelados)",
    "iFood: fermentados artesanais + emergência + galão de água",
  ],
  store_label: {
    forte_mensal: "Forte (mensal)",
    imperatriz_semanal: "Imperatriz (semanal)",
    imperatriz_topup: "Imperatriz (top-up)",
    ifood: "iFood",
  },
  profile_age: "Idade",
  profile_height: "Altura",
  profile_weight: "Peso",
  profile_bodyfat: "% Gordura",
  profile_bmr: "BMR",
  profile_goal: "Objetivo",
  profile_targets: "Targets nutricionais",
  profile_target_protein: "Proteína",
  profile_target_hydration: "Hidratação",
  profile_target_kcal_off: "Kcal off day",
  profile_target_kcal_skate: "Kcal skate day",
  profile_restrictions: "Restrições e aversões",
  profile_hard_no: "Bloqueio absoluto",
  profile_textures: "Texturas aversivas",
  profile_dislikes: "Não curte",
  profile_medical_flags: "Flags clínicas",
  history_title: (n) => `Histórico (últimos ${n} dia${n === 1 ? "" : "s"})`,
  history_empty: "Nada logado ainda. Comece marcando refeições em Hoje.",
  history_kcal_protein: (kcal, prot, n) => `${kcal} kcal · ${Math.round(prot)}g proteína · ${n} refeição${n === 1 ? "" : "es"}`,
  notifications: "Notificações de refeição",
  notifications_enable: "Ativar notificações dos horários",
  notifications_enabled: "Notificações ativas — você será avisado nos horários",
  notifications_denied: "Notificações negadas pelo navegador. Habilita nas configurações.",
  notifications_unsupported: "Este navegador não suporta notificações.",
  notification_title: (slot) => `${slot} agora`,
  notification_body: (label, time) => `${time} · ${label}`,
  predictions_title: "📊 Análise dos últimos 3 dias",
  predictions_no_data: "Loga algumas refeições e o sistema começa a sugerir ajustes baseados no que você comeu.",
  predictions_avg_summary: (kcal, protein, days) => `Média: ${kcal} kcal · ${protein}g proteína (${days} dia${days === 1 ? "" : "s"} com dados)`,
  predictions_adjustments_title: "Ajustes recomendados hoje",
  predictions_protein_boost: (g) => `+${g}g de proteína (compensar déficit recente)`,
  predictions_kcal_boost: (kcal) => `+${kcal} kcal (compensar déficit recente)`,
  predictions_hydration_extra: (l) => `+${l}L de hidratação extra hoje`,
  insight: {
    protein_deficit: (pct, boost) => `Proteína ${pct}% abaixo do alvo nos últimos dias. Hoje +${boost}g pra compensar.`,
    kcal_deficit: (pct, boost) => `Kcal ${pct}% abaixo da meta. Hoje +${boost} kcal sugerido.`,
    kcal_surplus: (pct) => `Kcal ${pct}% acima da meta nos últimos dias. Considera pegar mais leve hoje.`,
    missed_meals: (count) => `Pulou ${count} refeição${count === 1 ? "" : "es"} ontem. Próximas refeições aumentadas.`,
    easy_streak: (days) => `${days} dias seguidos no modo "fácil/líquido". Cansaço crônico ou trabalho pesado?`,
    fatigue_streak: (days) => `${days} dias seguidos com cansaço de casa. Considera meal-prep no domingo.`,
    post_substance: "Cocaína ontem: hidratação +1L, magnésio (cacau/castanhas/folhas), evita álcool, prioriza sono.",
    post_alcohol: "Álcool ontem: hidratação extra + B-complex (ovo/folhas/lentilha).",
    sleep_short: (hours) => `Só ${hours}h de sono. AM mais líquido + cafeína moderada, PM mais carbo.`,
    sleep_long: (hours) => `${hours}h de sono — corpo ainda processando. AM gentil, sem forçar.`,
    on_track: "Tudo nos eixos nos últimos dias. Mantém o ritmo.",
  },
  plan_title: "Plano semanal",
  plan_intro: "Veja o plano da semana e gere o da próxima com IA baseado no que você comeu.",
  plan_source_seed: "Plano hand-crafted (semana 1)",
  plan_source_ai: (when) => `Gerado por IA · ${when}`,
  plan_source_fallback: "Usando plano padrão (sem geração específica pra esta semana)",
  plan_generate_button: "Gerar com IA usando logs recentes",
  plan_generating: "Gerando plano…",
  plan_regenerate_button: "Regerar com IA",
  plan_clear_button: "Voltar pro plano padrão",
  plan_ai_disabled: "IA não configurada (falta ANTHROPIC_API_KEY no Vercel).",
  plan_generation_failed: (msg) => `Falhou: ${msg}`,
  plan_week_starting: (date) => `Semana começando ${date}`,
  plan_next_week_button: "Próxima semana →",
  plan_prev_week_button: "← Semana anterior",
  plan_this_week_button: "Esta semana",
  plan_day_summary: (kcal, protein, meals) => `${kcal} kcal · ${protein}g prot · ${meals} refeições`,
  analyst_title: "Padrões",
  analyst_intro: "Análise dos últimos dias logados.",
  analyst_window_7: "7 dias",
  analyst_window_14: "14 dias",
  analyst_window_30: "30 dias",
  analyst_no_data: "Loga pelo menos 3 dias pra ver padrões.",
  analyst_days_with_data: (n, w) => `${n} de ${w} dias com dados`,
  analyst_section_macros_by_dow: "Média por dia da semana",
  analyst_section_missed_slots: "Refeições mais puladas",
  analyst_section_state_distribution: "Distribuição de estados",
  analyst_section_correlations: "Correlações",
  analyst_section_insights: "Padrões detectados",
  analyst_dow_short: { sun: "Dom", mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb" },
  analyst_correlation_sleep: (low, high) => `Sono curto (<6h): média ${low} kcal · Sono normal: média ${high} kcal`,
  analyst_correlation_substance: (kcal) => `Dia pós-substância: média ${kcal} kcal`,
  analyst_max_easy_streak: (days) => `Maior streak de fácil/líquido: ${days} dias`,
  analyst_fatigue_days: (days) => `Cansaço de casa logado em ${days} dias`,
  habit_insight: {
    chronic_protein_deficit: (avg, target) => `Proteína média de ${avg}g/dia (alvo ${target}g). Considere shake noturno extra ou ajuste de porções.`,
    chronic_kcal_deficit: (avg, target) => `Média de ${avg} kcal/dia abaixo do alvo (${target}). Pode estar perdendo composição corporal.`,
    most_missed_slot: (slot, count) => `${slot} foi pulado ${count}x — considere mover horário ou simplificar a opção.`,
    weekend_heavier: (delta) => `Finais de semana ${delta} kcal acima da média de dia útil.`,
    workday_lighter: (delta) => `Dias úteis ${delta} kcal abaixo dos fins de semana — risco de déficit acumulado.`,
    sleep_short_pattern: (count) => `${count} noites com <6h de sono. Padrão consistente afeta tudo (apetite, recuperação, humor).`,
    on_track: "Padrão consistente com os alvos. Mantém.",
  },
};

const en: Dict = {
  app_name: "Plan A",
  nav: { today: "Today", shopping: "Shopping", profile: "Profile", history: "History", plan: "Plan", analyst: "Patterns" },
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  prev_day: "Previous day",
  next_day: "Next day",
  jump_to_today: "Today",
  sleep_on_wake: "Sleep on wake",
  prep_time_today: "Prep time today",
  house_fatigue: "House fatigue",
  house_fatigue_btn: "I'm too tired today",
  house_fatigue_active_note: "Card defaults set to Easy. Acceptable delivery: poke / sushi / Peruvian / Japanese.",
  clear: "Clear",
  substance_log: "Substance log",
  logged_today: "Logged today",
  tap_to_remove: "Tap to remove",
  skate_day: "Skate day",
  recovery: "Recovery",
  kcal: "Kcal",
  protein: "Protein",
  state: {
    original: "Original",
    easy: "Easy",
    liquid: "Liquid",
    no_hunger: "Not hungry",
  },
  state_desc: {
    original: "Full planned meal",
    easy: "Grab-and-eat, no cooking",
    liquid: "Smoothie, shake, or soup",
    no_hunger: "Minimum to keep the chain unbroken",
  },
  slots: {
    cafe_da_manha: "Breakfast",
    lanche_manha: "Mid-morning snack",
    almoco: "Lunch",
    lanche_tarde: "Afternoon snack",
    jantar: "Dinner",
    snack_noturno: "Late-night snack",
  },
  ate_this: "Ate this",
  update_version: "Update version",
  undo: "Undo",
  logging: "Logging…",
  updating: "Updating…",
  saving: "Saving…",
  logged: "Logged",
  min_prep: "min prep",
  show_ingredients: (n) => `Show ${n} ingredient${n === 1 ? "" : "s"}`,
  hide_ingredients: "Hide ingredients",
  edit_or_other: "Edit / ate something else",
  cancel: "Cancel",
  save: "Save",
  custom_label: "What I ate (free text)",
  custom_kcal: "kcal (optional)",
  custom_protein: "protein in g (optional)",
  custom_hint: "Overrides the suggestion. Leave kcal/protein blank if unknown.",
  sub: { cocaine: "coke", alcohol: "alcohol", cannabis: "cannabis", tobacco: "tobacco", benzo: "benzo" },
  carbs: "C",
  fat: "F",
  toggle_lang: "PT",
  beverages: "Beverages (mate / coffee / tea / treats)",
  beverage: { mate: "mate", coffee: "coffee", tea: "tea", treat: "treat" },
  amount_placeholder: (type) => {
    if (type === "mate") return "e.g., 1 gourd / 500ml";
    if (type === "coffee") return "e.g., 1 espresso / 200ml";
    if (type === "tea") return "e.g., 1 cup";
    return "e.g., chocolate, ice cream";
  },
  add: "Add",
  last_mate: "Last mate",
  last_coffee: "Last coffee",
  none_yet: "none yet",
  consumed_at_label: "Time (HH:MM)",
  estimate_with_ai: "Estimate nutrition with AI",
  estimating: "Estimating…",
  ai_not_configured: "AI not configured (missing ANTHROPIC_API_KEY)",
  ai_estimate_failed: "Estimation failed. Fill manually.",
  ai_confidence: { low: "low confidence", medium: "medium confidence", high: "high confidence" },
  shopping_title: "Weekly shopping list",
  shopping_subtitle: (selfKg, trips, deliveryKg) => `Total self-carry: ${selfKg} kg (${trips} trip${trips === 1 ? "" : "s"} × 20kg max). Total delivery: ${deliveryKg} kg.`,
  shopping_delivery: "🚚 Delivery (to your door)",
  shopping_delivery_empty: "No item heavy enough to require delivery this week.",
  shopping_self_carry: "🚶 Carry up",
  shopping_rules_title: "Rules applied:",
  shopping_rules: [
    "Per-trip cap: 20 kg (2 people × 2 trips = up to 80 kg/session)",
    "Items > 5 kg: tagged delivery-preferred",
    "Forte monthly: shelf-stable bulk (oils, dry grains, honey, nuts, coffee)",
    "Imperatriz weekly: fresh (proteins, produce, dairy, frozen)",
    "iFood: artisanal ferments + emergency + water jug",
  ],
  store_label: {
    forte_mensal: "Forte (monthly)",
    imperatriz_semanal: "Imperatriz (weekly)",
    imperatriz_topup: "Imperatriz (top-up)",
    ifood: "iFood",
  },
  profile_age: "Age",
  profile_height: "Height",
  profile_weight: "Weight",
  profile_bodyfat: "Body fat %",
  profile_bmr: "BMR",
  profile_goal: "Goal",
  profile_targets: "Nutrition targets",
  profile_target_protein: "Protein",
  profile_target_hydration: "Hydration",
  profile_target_kcal_off: "Kcal off day",
  profile_target_kcal_skate: "Kcal skate day",
  profile_restrictions: "Restrictions & aversions",
  profile_hard_no: "Hard block",
  profile_textures: "Texture aversions",
  profile_dislikes: "Soft dislikes",
  profile_medical_flags: "Clinical flags",
  history_title: (n) => `History (last ${n} day${n === 1 ? "" : "s"})`,
  history_empty: "Nothing logged yet. Start by logging meals in Today.",
  history_kcal_protein: (kcal, prot, n) => `${kcal} kcal · ${Math.round(prot)}g protein · ${n} meal${n === 1 ? "" : "s"}`,
  notifications: "Meal-time notifications",
  notifications_enable: "Enable meal-time notifications",
  notifications_enabled: "Notifications active — you'll be alerted at meal times",
  notifications_denied: "Notifications denied by your browser. Enable in settings.",
  notifications_unsupported: "Your browser doesn't support notifications.",
  notification_title: (slot) => `${slot} now`,
  notification_body: (label, time) => `${time} · ${label}`,
  predictions_title: "📊 Last 3 days analysis",
  predictions_no_data: "Log a few meals and the system will start suggesting adjustments based on what you actually ate.",
  predictions_avg_summary: (kcal, protein, days) => `Average: ${kcal} kcal · ${protein}g protein (${days} day${days === 1 ? "" : "s"} with data)`,
  predictions_adjustments_title: "Recommended adjustments today",
  predictions_protein_boost: (g) => `+${g}g protein (compensate recent deficit)`,
  predictions_kcal_boost: (kcal) => `+${kcal} kcal (compensate recent deficit)`,
  predictions_hydration_extra: (l) => `+${l}L extra hydration today`,
  insight: {
    protein_deficit: (pct, boost) => `Protein ${pct}% below target in recent days. Today +${boost}g to compensate.`,
    kcal_deficit: (pct, boost) => `Kcal ${pct}% below target. Today +${boost} kcal suggested.`,
    kcal_surplus: (pct) => `Kcal ${pct}% above target recently. Consider going lighter today.`,
    missed_meals: (count) => `Skipped ${count} meal${count === 1 ? "" : "s"} yesterday. Next meals boosted.`,
    easy_streak: (days) => `${days} days in a row in "easy/liquid" mode. Chronic fatigue or heavy work?`,
    fatigue_streak: (days) => `${days} days in a row with house fatigue. Consider Sunday batch-cooking.`,
    post_substance: "Cocaine yesterday: hydration +1L, magnesium (cacao/nuts/greens), avoid alcohol, prioritize sleep.",
    post_alcohol: "Alcohol yesterday: extra hydration + B-complex (egg/greens/lentil).",
    sleep_short: (hours) => `Only ${hours}h sleep. AM more liquid + moderate caffeine, PM more carbs.`,
    sleep_long: (hours) => `${hours}h sleep — body still processing. Gentle AM, no forcing.`,
    on_track: "All on track over recent days. Keep the rhythm.",
  },
  plan_title: "Weekly plan",
  plan_intro: "See this week's plan and generate next week with AI based on what you actually ate.",
  plan_source_seed: "Hand-crafted plan (week 1)",
  plan_source_ai: (when) => `AI-generated · ${when}`,
  plan_source_fallback: "Using default plan (no specific generation for this week)",
  plan_generate_button: "Generate with AI from recent logs",
  plan_generating: "Generating plan…",
  plan_regenerate_button: "Regenerate with AI",
  plan_clear_button: "Revert to default plan",
  plan_ai_disabled: "AI not configured (ANTHROPIC_API_KEY missing in Vercel).",
  plan_generation_failed: (msg) => `Failed: ${msg}`,
  plan_week_starting: (date) => `Week starting ${date}`,
  plan_next_week_button: "Next week →",
  plan_prev_week_button: "← Previous week",
  plan_this_week_button: "This week",
  plan_day_summary: (kcal, protein, meals) => `${kcal} kcal · ${protein}g protein · ${meals} meals`,
  analyst_title: "Patterns",
  analyst_intro: "Analysis of recent logged days.",
  analyst_window_7: "7 days",
  analyst_window_14: "14 days",
  analyst_window_30: "30 days",
  analyst_no_data: "Log at least 3 days to see patterns.",
  analyst_days_with_data: (n, w) => `${n} of ${w} days with data`,
  analyst_section_macros_by_dow: "Average by day of week",
  analyst_section_missed_slots: "Most-skipped meals",
  analyst_section_state_distribution: "State distribution",
  analyst_section_correlations: "Correlations",
  analyst_section_insights: "Detected patterns",
  analyst_dow_short: { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" },
  analyst_correlation_sleep: (low, high) => `Short sleep (<6h): avg ${low} kcal · Normal sleep: avg ${high} kcal`,
  analyst_correlation_substance: (kcal) => `Post-substance day: avg ${kcal} kcal`,
  analyst_max_easy_streak: (days) => `Longest easy/liquid streak: ${days} days`,
  analyst_fatigue_days: (days) => `House-fatigue logged on ${days} days`,
  habit_insight: {
    chronic_protein_deficit: (avg, target) => `Average protein ${avg}g/day (target ${target}g). Consider adding a nighttime shake or larger portions.`,
    chronic_kcal_deficit: (avg, target) => `Average ${avg} kcal/day below target (${target}). You may be losing body composition.`,
    most_missed_slot: (slot, count) => `${slot} was skipped ${count}x — consider moving the time or simplifying the option.`,
    weekend_heavier: (delta) => `Weekends ${delta} kcal above weekday average.`,
    workday_lighter: (delta) => `Workdays ${delta} kcal below weekends — risk of cumulative deficit.`,
    sleep_short_pattern: (count) => `${count} nights with <6h sleep. Consistent pattern affects everything (appetite, recovery, mood).`,
    on_track: "Pattern consistent with targets. Keep going.",
  },
};

const dicts: Record<Lang, Dict> = { pt, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
