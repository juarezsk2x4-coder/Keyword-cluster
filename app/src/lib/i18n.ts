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
};

const dicts: Record<Lang, Dict> = { pt, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
