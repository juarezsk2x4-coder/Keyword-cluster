# Meal Card State Toggle — Tracker UX Design

> Design spec for the meal-logging UI in the Next.js app. Each meal card carries multiple state-aware alternatives so the user can swap suggestions in real time based on how he's actually feeling at the moment.

## Problem

The user has documented:
- Interocepção autística (often can't identify hunger)
- ADHD on max-dose Venvanse (AM appetite suppression)
- Anedonia clinically relevant (low motivation for cooking)
- Sleep variability (hipo + hipersonia)
- Substance days (post-cocaine appetite shifts, cannabis snack windows)
- Real-life fatigue from caring for a big house, leading to **delivery + burgers** when planned meals feel like too much

A static meal plan ("today at 12:30 you eat patinho + arroz + brócolis") fails on the days he's tired, has no appetite, just woke up at 14h, or just doesn't want to chew. Result: plan ignored, delivery wins, day's nutrition collapses.

## Solution: 4 alternatives per meal slot, toggled by a single button

Every meal card the planner generates carries **4 versions** of the same nutritional intent, ordered by friction:

| State | Meaning | Constraints |
|---|---|---|
| `original` | The full planned meal | Default. Cooked or assembled. ~30 min total effort. |
| `easy` | "Quero algo fácil de comer" | <5 min, no cooking, grab-from-fridge. Different macros allowed. |
| `liquid` | "Prefiro líquidos" | Smoothie, shake or sopa. Drinkable. Same protein target if possible. |
| `no_hunger` | "Sem fome agora" | Smallest viable intake — maintains chain of meals without forcing. Líquido pequeno ou snack mínimo. |

UI shows `original` by default. A single button (cycling or 4-state segmented control) swaps the displayed card and the logged alternative. When user logs as eaten, the **currently selected state** is recorded.

## Card data shape

```typescript
type MealCard = {
  slot: "cafe_da_manha" | "lanche_manha" | "almoco" | "lanche_tarde" | "jantar" | "snack_noturno";
  scheduled_time: string;
  alternatives: {
    original:    MealVersion;
    easy:        MealVersion;
    liquid:      MealVersion;
    no_hunger:   MealVersion;
  };
  selected_state: "original" | "easy" | "liquid" | "no_hunger" | null;
  consumed_at: string | null;
};

type MealVersion = {
  label: string;
  ingredients: Ingredient[];
  prep_minutes: number;
  kcal_estimate: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_steps?: string[];
  storage_location: "fridge" | "freezer" | "pantry" | "delivery_fallback";
  required_pantry_items: string[];
  notes?: string;
};
```

## Generation rules for the Meal Plan Designer agent

For every slot, generate 4 versions with these constraints:

### `original`
- Aim at the day's macro target for that slot.
- Up to 30 min total prep (cook + assembly).
- Uses ingredients on the week's shopping list.
- Respects all texture aversions, hard_no, current chicken phase, etc.

### `easy`
- **No cooking.** Pure assembly from fridge/pantry.
- Grab-and-eat in <5 min.
- Texture-friendly (firm, defined, no escorregadio).
- Examples by slot:
  - Café: iogurte natural + granola + frutas vermelhas + castanhas + mel
  - Almoço: poke bowl frio (atum cru porcionado + arroz frio + abacate + edamame + shoyu)
  - Jantar: marmita pronta do batch (esquentar 2 min) + salada já lavada + limão
  - Snack noturno: queijo colonial + amêndoa + maçã

### `liquid`
- Smoothie, shake, ou sopa.
- Mantém o protein target do slot se possível.
- Não-mastigável.
- Examples:
  - Café: shake whey + manga + gengibre + limão + linhaça + leite (his signature smoothie + protein add)
  - Almoço: sopa missô + tofu + cogumelo + algas + ovo cozido picado em cima
  - Jantar: shake denso whey + cacau + banana + pasta amendoim + aveia + leite
  - Snack noturno: kombucha + colher de mel + canela

### `no_hunger`
- Mínimo viável pra não quebrar a cadeia.
- 100–250 kcal só.
- Foco: hidratação + 1 micronutriente alvo + um pouco de glicose pra cérebro.
- Examples:
  - Café: kombucha + 1 banana
  - Almoço: kombucha + 1 banana + castanha-do-pará 2un
  - Jantar: 1 iogurte natural + colher de mel
  - Snack noturno: pode pular (skip allowed)

## State transition logic

- User opens app → sees `original` by default.
- Taps the toggle (3 chips below card or "Trocar versão" button) → cycles `easy → liquid → no_hunger → original`.
- User logs the meal as eaten → currently selected state is what gets recorded.
- If `no_hunger` selected, next slot's targets get **slightly increased** by the Reconciler (adds back the deficit forward).
- If `easy` or `liquid` selected for **3 consecutive days**, Habit Analyst flags possible pattern (cansaço, casa, sono ruim, depressivo, hipomania alta) and surfaces a question on dashboard.

## Special case: substance-day overlay

If the day's log includes `cocaine` or `alcohol >2 units` the night before:
- `original` card auto-replaced by the **post-substance recovery template** (extra hidratação, Mg, tirosina-rich foods, no álcool, sleep priority).
- `easy` and `liquid` alternatives still respect the recovery profile.
- `no_hunger` warns: "Você usou X ontem. Recomendado pelo menos os líquidos de hoje pra repor magnésio e potássio."

## Special case: sleep log overlay

When user logs hours slept on waking:
- Slept <5h → AM slots default to `liquid` (denso, com cafeína moderada do mate); PM aumenta carbo.
- Slept 9h+ → AM slots default to `no_hunger` (corpo ainda processando); reintrodução gentil.
- Slept 6-8h → defaults remain.

## Special case: house-care fatigue button

Separate "Tô cansado da casa hoje" button on the dashboard (not per-meal):
- Sets all remaining meals of the day to `easy` defaults.
- Surfaces saved acceptable delivery list (poke / sushi / salada places — never burger junk).
- Logs the trigger so Habit Analyst sees frequency.

## Special case: adaptive prep-time signal ("quanto tempo eu tenho hoje?")

A daily dashboard input where the user declares available cooking time (or the system asks once per morning). The Meal Plan Designer translates this into the default state for the day's cards:

| User input | Default cards for the day |
|---|---|
| `≤5 min` | All slots → `liquid` ou `easy` |
| `6–15 min` | All slots → `easy` |
| `16–30 min` | Almoço → `original_simple` (one-pan, ≤15 ingredients); outros slots → `easy` |
| `>30 min` | All slots → `original_full` |

User can still manually override any card by toggling. The signal just sets the **default**.

For the **Sunday batch session**, a separate weekly input is asked Saturday night or Sunday morning: "Quanto tempo de prep no domingo?" The Designer outputs a batch plan calibrated:

| Sunday available | Batch plan output |
|---|---|
| `30–60 min` | 3 marmitas simples + folhas lavadas + frutas porcionadas |
| `60–120 min` | 5 marmitas + componentes (carne desfiada, arroz, batata-doce assada) + shake bases pré-mistas |
| `120–180 min` | 7 marmitas variadas + bechamel para a semana + molhos + granola caseira opcional |
| `<30 min` | Sistema sugere delivery-heavy semana ou marmita pré-pronta de fornecedor (Marmitex saudável Canasvieiras) |

Same input is asked for both household members independently — Person A and Person B prep capacity vary independently.

## Special case: 3rd floor walk-up shopping logic

The Shopping List Builder must respect the building access constraint:

- Itens com peso individual >3kg → tag `delivery_preferred`
- Total weekly weight >10kg → divide automatically into delivery (Imperatriz/iFood) e self-carry (apenas itens leves)
- Forte Atacado runs limited to monthly bulk e flagged como "consider skipping if total >10kg"
- Each shopping output is split into "🚚 Delivery (Imperatriz/iFood)" and "🚶 Self-carry (max Xkg)" sections
- A weight column is shown next to each item so the user can mentally estimate the trip burden before approving

## Why this design

1. **Honors interocepção comprometida**: not asking him to "feel hungry" — providing a real-time choice in 1 tap.
2. **Removes the "tudo ou nada" trap**: easy/liquid/no_hunger are still WIN paths, not failures. Plan adherence goes up.
3. **Replaces delivery+burger pattern**: easy alternatives are pre-planned and prepped, so the friction-of-cooking that drives delivery is removed before it triggers.
4. **Generates pattern data**: which alternative he picks reveals what he actually needs (more líquidos = bad sleep? more easy = sobrecarga doméstica?).
5. **Substance/sleep adaptive**: overlay rules make the system meet him where he is, not where the static plan thinks he should be.

## Implementation notes (for when we build)

- Meal Plan Designer generates all 4 versions on Sunday during weekly planning.
- All 4 sets of ingredients are reflected in the shopping list (with overlap deduplication).
- Storage tags drive Sunday batch-cook prep: `easy` items get pre-portioned, `liquid` items have shake-ready containers labeled.
- The Reconciler agent reads `selected_state` to compute deficits/surpluses correctly.
- The Habit Analyst surfaces state-selection trends weekly.
