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
  supplements_title: string;
  tap_to_mark_taken: string;
  exercise_log_title: string;
  exercise_other_label: string;
  exercise_other_placeholder: string;
  exercise_duration_placeholder: string;
  exercise_kcal_bonus: (kcal: number) => string;
  skate_day: string;
  recovery: string;
  kcal: string;
  protein: string;
  state: Record<CardState, string>;
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
  sub: { stimulant: string; alcohol: string; cannabis: string; tobacco: string; benzo: string };
  carbs: string;
  fat: string;
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
  unit_g_per_day: string;
  unit_l_per_day: string;
  notif_on: string;
  notif_off: string;
  lang_toggle_aria: string;
  person_toggle_aria: string;
  profile_restrictions: string;
  profile_hard_no: string;
  profile_textures: string;
  profile_dislikes: string;
  profile_medical_flags: string;
  calendar_feed_title: string;
  calendar_feed_hint: string;
  calendar_feed_not_configured: string;
  history_title: (n: number) => string;
  history_empty: string;
  history_kcal_protein: (kcal: number, prot: number, n: number) => string;
  history_exercises_title: string;
  history_supplements_title: string;
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
    skate_syncope_risk: string;
    sleep_short: (hours: number) => string;
    sleep_long: (hours: number) => string;
    on_track: string;
  };
  weather: {
    clear: string;
    cloudy: string;
    rain: string;
    storm: string;
    other: string;
    temp_range: (max: number, min: number) => string;
    good_skate_weather: string;
  };
  plan_title: string;
  plan_week_label: string;
  plan_this_week: string;
  plan_next_week: string;
  plan_source_label: string;
  plan_source_seed: string;
  plan_source_ai: string;
  plan_generate_button: string;
  plan_generating: string;
  plan_generate_hint: string;
  plan_generate_success: (n: number) => string;
  plan_generate_failed: string;
  plan_revert_to_seed: string;
  plan_revert_success: string;
  plan_revert_failed: string;
  plan_show_alternatives: string;
  analyst_title: string;
  analyst_window_7: string;
  analyst_window_14: string;
  analyst_window_30: string;
  analyst_empty: string;
  analyst_days_with_data: (n: number) => string;
  analyst_avg_kcal: (kcal: number) => string;
  analyst_avg_protein: (g: number) => string;
  analyst_by_dow_title: string;
  analyst_exercise_trend_title: string;
  analyst_dow_names: string[];
  analyst_most_missed_title: string;
  analyst_state_distribution_title: string;
  analyst_easy_streak_max: (days: number) => string;
  analyst_fatigue_days: (n: number) => string;
  analyst_substance_days: (n: number) => string;
  analyst_exercise_days: (n: number) => string;
  analyst_exercise_streak: (days: number) => string;
  analyst_exercise_kcal_total: (kcal: number) => string;
  analyst_supplement_adherence: (pct: number) => string;
  analyst_patterns_title: string;
  habit_insight: {
    chronic_under_kcal: (pct: number) => string;
    chronic_under_protein: (pct: number) => string;
    weekday_dip: (dow: string) => string;
    slot_chronically_missed: (slot: string, pct: number) => string;
    easy_dominance: (pct: number) => string;
    substance_correlation: string;
    fatigue_frequent: (days: number) => string;
    sleep_kcal_link: string;
    consider_professional_support: string;
    exercise_infrequent: (days: number) => string;
    supplement_adherence_low: (pct: number) => string;
    on_track: string;
  };
}

const pt: Dict = {
  app_name: "Plano A",
  nav: { today: "Hoje", shopping: "Compras", profile: "Perfil", history: "Histórico", plan: "Plano", analyst: "Analista" },
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
  supplements_title: "Vitaminas de hoje",
  tap_to_mark_taken: "Toque pra marcar como tomado",
  exercise_log_title: "Exercício de hoje",
  exercise_other_label: "+ Outro",
  exercise_other_placeholder: "Qual exercício?",
  exercise_duration_placeholder: "Quantos minutos?",
  exercise_kcal_bonus: (kcal) => `Gasto com exercício hoje: +${kcal} kcal`,
  skate_day: "Dia de skate",
  recovery: "Recuperação",
  kcal: "Kcal",
  protein: "Proteína",
  state: {
    original: "Original",
    easy: "Fácil",
    liquid: "Líquido",
    no_hunger: "Sem fome",
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
  min_prep: "min preparo",
  show_ingredients: (n) => `Ver ${n} ingrediente${n === 1 ? "" : "s"}`,
  hide_ingredients: "Esconder ingredientes",
  edit_or_other: "Editar / comi outra coisa",
  cancel: "Cancelar",
  save: "Salvar",
  custom_label: "O que comi (texto livre)",
  custom_kcal: "kcal (opcional)",
  custom_protein: "proteína em g (opcional)",
  custom_hint: "Substitui a sugestão. Deixa kcal/proteína em branco se não souber.",
  sub: { stimulant: "estimulante", alcohol: "álcool", cannabis: "cannabis", tobacco: "tabaco", benzo: "benzo" },
  carbs: "C",
  fat: "G",
  beverages: "Bebidas (mate / café / chá / guloseimas)",
  beverage: { mate: "mate", coffee: "café", tea: "chá", treat: "guloseima" },
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
    imperatriz_topup: "Imperatriz (reforço)",
    ifood: "iFood",
  },
  profile_age: "Idade",
  profile_height: "Altura",
  profile_weight: "Peso",
  profile_bodyfat: "% Gordura",
  profile_bmr: "TMB",
  profile_goal: "Objetivo",
  profile_targets: "Targets nutricionais",
  profile_target_protein: "Proteína",
  profile_target_hydration: "Hidratação",
  profile_target_kcal_off: "Kcal off day",
  profile_target_kcal_skate: "Kcal skate day",
  unit_g_per_day: "g/dia",
  unit_l_per_day: "L/dia",
  notif_on: "✓ LIGADO",
  notif_off: "DESLIGADO",
  lang_toggle_aria: "Alternar idioma",
  person_toggle_aria: "Trocar perfil ativo",
  profile_restrictions: "Restrições e aversões",
  profile_hard_no: "Bloqueio absoluto",
  profile_textures: "Texturas aversivas",
  profile_dislikes: "Não curte",
  profile_medical_flags: "Flags clínicas",
  calendar_feed_title: "Calendário (assinatura)",
  calendar_feed_hint: "Cole esta URL no Google Calendar / Apple Calendar como \"assinar calendário por URL\" — horários das refeições e dias de skate aparecem automaticamente.",
  calendar_feed_not_configured: "Assinatura de calendário desativada — falta configurar CALENDAR_FEED_TOKEN nas variáveis de ambiente.",
  history_title: (n) => `Histórico (últimos ${n} dia${n === 1 ? "" : "s"})`,
  history_empty: "Nada logado ainda. Comece marcando refeições em Hoje.",
  history_kcal_protein: (kcal, prot, n) => `${kcal} kcal · ${Math.round(prot)}g proteína · ${n} refeição${n === 1 ? "" : "es"}`,
  history_exercises_title: "Exercícios",
  history_supplements_title: "Suplementos",
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
    post_substance: "Estimulante ontem: hidratação +1L, magnésio (cacau/castanhas/folhas), evita álcool, prioriza sono.",
    post_alcohol: "Álcool ontem: hidratação extra + B-complex (ovo/folhas/lentilha).",
    skate_syncope_risk: "Uso recente + skate hoje: risco maior de síncope (Mg baixo + desidratação prévia). Hidratação extra (+1L), eletrólito antes de sair, considera intensidade mais leve hoje.",
    sleep_short: (hours) => `Só ${hours}h de sono. AM mais líquido + cafeína moderada, PM mais carbo.`,
    sleep_long: (hours) => `${hours}h de sono — corpo ainda processando. AM gentil, sem forçar.`,
    on_track: "Tudo nos eixos nos últimos dias. Mantém o ritmo.",
  },
  weather: {
    clear: "Céu limpo",
    cloudy: "Nublado",
    rain: "Chuva",
    storm: "Tempestade",
    other: "Condição indefinida",
    temp_range: (max, min) => `${Math.round(max)}° / ${Math.round(min)}°`,
    good_skate_weather: "☀️ Boa condição pra skate hoje",
  },
  plan_title: "🗓 Plano semanal",
  plan_week_label: "Semana começando em",
  plan_this_week: "Esta semana",
  plan_next_week: "Próxima semana",
  plan_source_label: "Origem do plano:",
  plan_source_seed: "Hand-crafted (semente)",
  plan_source_ai: "Gerado por IA",
  plan_generate_button: "Gerar com IA baseado na semana passada",
  plan_generating: "Gerando plano... (até 30s)",
  plan_generate_hint: "A IA usa o seu perfil + últimos 7 dias logados pra adaptar o plano.",
  plan_generate_success: (n) => `Plano gerado com sucesso (${n} dias). Veja abaixo.`,
  plan_generate_failed: "Erro ao gerar. Tente novamente ou veja os logs.",
  plan_revert_to_seed: "Voltar pro plano hand-crafted",
  plan_revert_success: "Plano IA removido. Voltou pra semente.",
  plan_revert_failed: "Erro ao reverter.",
  plan_show_alternatives: "Ver alternativas (easy / liquid / sem fome)",
  analyst_title: "📈 Analista de hábitos",
  analyst_window_7: "7 dias",
  analyst_window_14: "14 dias",
  analyst_window_30: "30 dias",
  analyst_empty: "Sem dados suficientes ainda. Loga refeições por alguns dias e o analista começa a mostrar padrões.",
  analyst_days_with_data: (n) => `${n} dias com dados`,
  analyst_avg_kcal: (kcal) => `Média kcal/dia: ${kcal}`,
  analyst_avg_protein: (g) => `Média proteína/dia: ${g}g`,
  analyst_by_dow_title: "Por dia da semana",
  analyst_exercise_trend_title: "Tendência de kcal em exercício",
  analyst_dow_names: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  analyst_most_missed_title: "Slots mais pulados",
  analyst_state_distribution_title: "Distribuição de estados",
  analyst_easy_streak_max: (days) => `Maior sequência easy/líquido: ${days} dias`,
  analyst_fatigue_days: (n) => `Dias com cansaço de casa: ${n}`,
  analyst_substance_days: (n) => `Dias com substâncias: ${n}`,
  analyst_exercise_days: (n) => `Dias com exercício: ${n}`,
  analyst_exercise_streak: (days) => `Maior sequência de exercício: ${days} dia${days === 1 ? "" : "s"}`,
  analyst_exercise_kcal_total: (kcal) => `Kcal total gasto em exercício: ${kcal}`,
  analyst_supplement_adherence: (pct) => `Adesão às vitaminas: ${pct}%`,
  analyst_patterns_title: "Padrões detectados",
  habit_insight: {
    chronic_under_kcal: (pct) => `Você está ${pct}% abaixo da meta de kcal de forma recorrente. Pode estar perdendo massa magra.`,
    chronic_under_protein: (pct) => `Proteína ${pct}% abaixo da meta de forma recorrente. Anabolismo comprometido.`,
    weekday_dip: (dow) => `${dow} é seu dia mais fraco em kcal. Considera meal-prep ou comida pronta.`,
    slot_chronically_missed: (slot, pct) => `${slot} foi pulado em ${pct}% dos dias. Slot não-funcional — revise o horário ou o tipo.`,
    easy_dominance: (pct) => `${pct}% das refeições foram "easy" ou "liquid". Indica cansaço persistente ou rotina sobrecarregada.`,
    substance_correlation: "Dias com substâncias coincidem com baixa ingestão. Recovery food no dia seguinte ajuda.",
    fatigue_frequent: (days) => `${days} dias com cansaço de casa registrado. Considera fixar batch-cook no domingo.`,
    exercise_infrequent: (days) => `Só ${days} dia${days === 1 ? "" : "s"} de exercício nessa janela. Considera encaixar mais sessões.`,
    supplement_adherence_low: (pct) => `Adesão às vitaminas em ${pct}% nessa janela.`,
    sleep_kcal_link: "Sono curto (<6h) coincide com kcal mais alto (compensação). Prioriza sono.",
    consider_professional_support: "Esse padrão combinado (não um sinal isolado) já passou do que ajuste de plano ou mais logging costuma resolver sozinho. Pode valer a pena levar isso pra uma conversa com seu médico ou terapeuta — não é algo que o app vai resolver por mais dados que você registre.",
    on_track: "Padrões estáveis dentro das metas. Boa cadência.",
  },
};

const en: Dict = {
  app_name: "Plan A",
  nav: { today: "Today", shopping: "Shopping", profile: "Profile", history: "History", plan: "Plan", analyst: "Analyst" },
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
  supplements_title: "Today's supplements",
  tap_to_mark_taken: "Tap to mark as taken",
  exercise_log_title: "Today's exercise",
  exercise_other_label: "+ Other",
  exercise_other_placeholder: "Which exercise?",
  exercise_duration_placeholder: "How many minutes?",
  exercise_kcal_bonus: (kcal) => `Spent on exercise today: +${kcal} kcal`,
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
  sub: { stimulant: "stimulant", alcohol: "alcohol", cannabis: "cannabis", tobacco: "tobacco", benzo: "benzo" },
  carbs: "C",
  fat: "F",
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
  unit_g_per_day: "g/day",
  unit_l_per_day: "L/day",
  notif_on: "✓ ON",
  notif_off: "OFF",
  lang_toggle_aria: "Toggle language",
  person_toggle_aria: "Switch active profile",
  profile_restrictions: "Restrictions & aversions",
  profile_hard_no: "Hard block",
  profile_textures: "Texture aversions",
  profile_dislikes: "Soft dislikes",
  profile_medical_flags: "Clinical flags",
  calendar_feed_title: "Calendar subscription",
  calendar_feed_hint: "Paste this URL into Google Calendar / Apple Calendar as \"subscribe to calendar by URL\" — meal times and skate days show up automatically.",
  calendar_feed_not_configured: "Calendar subscription disabled — CALENDAR_FEED_TOKEN needs to be set in environment variables.",
  history_title: (n) => `History (last ${n} day${n === 1 ? "" : "s"})`,
  history_empty: "Nothing logged yet. Start by logging meals in Today.",
  history_kcal_protein: (kcal, prot, n) => `${kcal} kcal · ${Math.round(prot)}g protein · ${n} meal${n === 1 ? "" : "s"}`,
  history_exercises_title: "Exercise",
  history_supplements_title: "Supplements",
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
    post_substance: "Stimulant yesterday: hydration +1L, magnesium (cacao/nuts/greens), avoid alcohol, prioritize sleep.",
    post_alcohol: "Alcohol yesterday: extra hydration + B-complex (egg/greens/lentil).",
    skate_syncope_risk: "Recent use + skate today: higher syncope risk (low Mg + prior dehydration). Extra hydration (+1L), electrolytes before heading out, consider a lighter intensity today.",
    sleep_short: (hours) => `Only ${hours}h sleep. AM more liquid + moderate caffeine, PM more carbs.`,
    sleep_long: (hours) => `${hours}h sleep — body still processing. Gentle AM, no forcing.`,
    on_track: "All on track over recent days. Keep the rhythm.",
  },
  weather: {
    clear: "Clear skies",
    cloudy: "Cloudy",
    rain: "Rain",
    storm: "Storm",
    other: "Unknown condition",
    temp_range: (max, min) => `${Math.round(max)}° / ${Math.round(min)}°`,
    good_skate_weather: "☀️ Good skate weather today",
  },
  plan_title: "🗓 Weekly plan",
  plan_week_label: "Week starting",
  plan_this_week: "This week",
  plan_next_week: "Next week",
  plan_source_label: "Plan source:",
  plan_source_seed: "Hand-crafted (seed)",
  plan_source_ai: "AI-generated",
  plan_generate_button: "Generate with AI based on last week",
  plan_generating: "Generating... (up to 30s)",
  plan_generate_hint: "The AI uses your profile + last 7 days of logs to adapt the plan.",
  plan_generate_success: (n) => `Plan generated (${n} days). See below.`,
  plan_generate_failed: "Failed to generate. Try again or check logs.",
  plan_revert_to_seed: "Revert to hand-crafted plan",
  plan_revert_success: "AI plan removed. Reverted to seed.",
  plan_revert_failed: "Failed to revert.",
  plan_show_alternatives: "Show alternatives (easy / liquid / not hungry)",
  analyst_title: "📈 Habit analyst",
  analyst_window_7: "7 days",
  analyst_window_14: "14 days",
  analyst_window_30: "30 days",
  analyst_empty: "Not enough data yet. Log meals for a few days and the analyst will start surfacing patterns.",
  analyst_days_with_data: (n) => `${n} days with data`,
  analyst_avg_kcal: (kcal) => `Avg kcal/day: ${kcal}`,
  analyst_avg_protein: (g) => `Avg protein/day: ${g}g`,
  analyst_by_dow_title: "By day of week",
  analyst_exercise_trend_title: "Exercise kcal trend",
  analyst_dow_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  analyst_most_missed_title: "Most-missed slots",
  analyst_state_distribution_title: "State distribution",
  analyst_easy_streak_max: (days) => `Longest easy/liquid streak: ${days} days`,
  analyst_fatigue_days: (n) => `House-fatigue days: ${n}`,
  analyst_substance_days: (n) => `Days with substances: ${n}`,
  analyst_exercise_days: (n) => `Exercise days: ${n}`,
  analyst_exercise_streak: (days) => `Longest exercise streak: ${days} day${days === 1 ? "" : "s"}`,
  analyst_exercise_kcal_total: (kcal) => `Total kcal spent on exercise: ${kcal}`,
  analyst_supplement_adherence: (pct) => `Supplement adherence: ${pct}%`,
  analyst_patterns_title: "Detected patterns",
  habit_insight: {
    chronic_under_kcal: (pct) => `You're chronically ${pct}% under kcal target. May be losing lean mass.`,
    chronic_under_protein: (pct) => `Protein chronically ${pct}% under target. Anabolism compromised.`,
    weekday_dip: (dow) => `${dow} is your lowest-kcal day. Consider meal-prep or pre-cooked food.`,
    slot_chronically_missed: (slot, pct) => `${slot} skipped on ${pct}% of days. Non-functional slot — revisit time or type.`,
    easy_dominance: (pct) => `${pct}% of meals were "easy" or "liquid". Indicates persistent fatigue or overloaded routine.`,
    substance_correlation: "Substance-use days coincide with low intake. Recovery food the next day helps.",
    fatigue_frequent: (days) => `${days} house-fatigue days logged. Consider fixing Sunday batch-cook.`,
    exercise_infrequent: (days) => `Only ${days} exercise day${days === 1 ? "" : "s"} in this window. Consider fitting in more sessions.`,
    supplement_adherence_low: (pct) => `Supplement adherence at ${pct}% this window.`,
    sleep_kcal_link: "Short sleep (<6h) correlates with higher kcal (compensation). Prioritize sleep.",
    consider_professional_support: "This combined pattern (not just one flag on its own) has gone past what a plan tweak or more logging usually fixes by itself. Might be worth bringing this to your doctor or therapist — it's not something the app is going to solve with more data.",
    on_track: "Patterns stable within targets. Good cadence.",
  },
};

const dicts: Record<Lang, Dict> = { pt, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
