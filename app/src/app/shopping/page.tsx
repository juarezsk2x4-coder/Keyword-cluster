import { buildShoppingList } from "@/lib/seed-plan";

const STORE_LABELS: Record<string, string> = {
  forte_mensal: "Forte (mensal)",
  imperatriz_semanal: "Imperatriz (semanal)",
  imperatriz_topup: "Imperatriz (top-up)",
  ifood: "iFood",
};

export default function ShoppingPage() {
  const { delivery, self_carry } = buildShoppingList();

  const totalSelfCarryKg = self_carry.reduce((sum, i) => sum + i.estimated_weight_kg, 0);
  const totalDeliveryKg = delivery.reduce((sum, i) => sum + i.estimated_weight_kg, 0);

  // Group self-carry by store
  const byStore = self_carry.reduce<Record<string, typeof self_carry>>((acc, i) => {
    (acc[i.store_suggestion] ||= []).push(i);
    return acc;
  }, {});

  const tripsNeeded = Math.ceil(totalSelfCarryKg / 20);

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-1">Lista de compras da semana</h1>
        <div className="text-xs text-muted">
          Total self-carry: {totalSelfCarryKg.toFixed(1)} kg ({tripsNeeded} viagem{tripsNeeded === 1 ? "" : "ns"} × 20kg max). Total delivery: {totalDeliveryKg.toFixed(1)} kg.
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2 flex items-center gap-2">🚚 Delivery (entregue na porta)</h2>
        {delivery.length === 0 ? (
          <p className="text-sm text-muted">Nenhum item pesado o suficiente pra delivery obrigatório esta semana.</p>
        ) : (
          <ul className="space-y-2">
            {delivery.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <div>
                  <div>{item.name} <span className="text-muted">— {item.quantity}</span></div>
                  <div className="text-xs text-muted">{STORE_LABELS[item.store_suggestion] ?? item.store_suggestion}</div>
                </div>
                <div className="text-xs text-muted">{item.estimated_weight_kg.toFixed(1)} kg</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {Object.entries(byStore).map(([store, items]) => {
        const kg = items.reduce((s, i) => s + i.estimated_weight_kg, 0);
        return (
          <div className="card" key={store}>
            <h2 className="font-semibold mb-2 flex items-center justify-between">
              <span>🚶 Subir — {STORE_LABELS[store] ?? store}</span>
              <span className="text-xs text-muted font-normal">{kg.toFixed(1)} kg</span>
            </h2>
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <div>
                    <span>{item.name}</span>
                    <span className="text-muted"> — {item.quantity}</span>
                    <span className="ml-2 chip text-xs">{item.category}</span>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap ml-2">{item.estimated_weight_kg.toFixed(1)} kg</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="card text-xs text-muted">
        <p className="mb-2"><strong>Regras aplicadas:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cap por subida: 20 kg (2 pessoas × 2 viagens = até 80 kg/sessão)</li>
          <li>Itens individuais &gt; 5 kg: tag delivery preferred</li>
          <li>Forte mensal: shelf-stable bulk (óleos, grãos secos, mel, castanhas, café)</li>
          <li>Imperatriz semanal: frescos (proteínas, hortifrúti, lácteos, congelados)</li>
          <li>iFood: fermentados artesanais + emergência + galão de água</li>
        </ul>
      </div>
    </div>
  );
}
