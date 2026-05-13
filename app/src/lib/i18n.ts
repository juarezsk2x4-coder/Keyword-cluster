import type { CardState, MealSlot } from "./types";

export type Lang = "pt" | "en";

interface Dict {
  app_name: string;
  nav: { today: string; shopping: string; profile: string; history: string };
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
}

const pt: Dict = {
  app_name: "Plano A",
  nav: { today: "Hoje", shopping: "Compras", profile: "Perfil", history: "Histórico" },
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
};

const en: Dict = {
  app_name: "Plan A",
  nav: { today: "Today", shopping: "Shopping", profile: "Profile", history: "History" },
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
};

const dicts: Record<Lang, Dict> = { pt, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
