import { buildShoppingList } from "@/lib/seed-plan";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";

export default async function ShoppingPage() {
  const { delivery, self_carry } = buildShoppingList();
  const lang = await getLang();
  const tr = t(lang);

  const totalSelfCarryKg = self_carry.reduce((sum, i) => sum + i.estimated_weight_kg, 0);
  const totalDeliveryKg = delivery.reduce((sum, i) => sum + i.estimated_weight_kg, 0);

  const byStore = self_carry.reduce<Record<string, typeof self_carry>>((acc, i) => {
    (acc[i.store_suggestion] ||= []).push(i);
    return acc;
  }, {});

  const tripsNeeded = Math.ceil(totalSelfCarryKg / 20);

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-1">{tr.shopping_title}</h1>
        <div className="text-xs text-muted">
          {tr.shopping_subtitle(totalSelfCarryKg.toFixed(1), tripsNeeded, totalDeliveryKg.toFixed(1))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">{tr.shopping_delivery}</h2>
        {delivery.length === 0 ? (
          <p className="text-sm text-muted">{tr.shopping_delivery_empty}</p>
        ) : (
          <ul className="space-y-2">
            {delivery.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <div>
                  <div>{item.name} <span className="text-muted">— {item.quantity}</span></div>
                  <div className="text-xs text-muted">{tr.store_label[item.store_suggestion as keyof typeof tr.store_label] ?? item.store_suggestion}</div>
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
              <span>{tr.shopping_self_carry} — {tr.store_label[store as keyof typeof tr.store_label] ?? store}</span>
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
        <p className="mb-2"><strong>{tr.shopping_rules_title}</strong></p>
        <ul className="list-disc list-inside space-y-1">
          {tr.shopping_rules.map((rule, i) => <li key={i}>{rule}</li>)}
        </ul>
      </div>
    </div>
  );
}
