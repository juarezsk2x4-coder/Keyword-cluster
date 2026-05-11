import { loadPersonA } from "@/lib/profile";

export default function ProfilePage() {
  const p = loadPersonA();

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">{p.name}</h1>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="label block">Idade</span>{p.age_years}</div>
          <div><span className="label block">Altura</span>{p.height_cm} cm</div>
          <div><span className="label block">Peso</span>{p.weight_kg} kg</div>
          <div><span className="label block">% Gordura</span>{p.body_fat_pct}</div>
          <div><span className="label block">BMR</span>{p.estimated_bmr_kcal} kcal</div>
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">Objetivo</h2>
        <p className="text-sm mb-1">{p.goals.primary}</p>
        <p className="text-xs text-muted">{p.goals.philosophical}</p>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {p.goals.performance_focus.map((f, i) => <span key={i} className="chip">{f}</span>)}
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">Targets nutricionais</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="label block">Proteína</span>{p.nutrition_targets.protein_g_per_day} g/dia</div>
          <div><span className="label block">Hidratação</span>{p.nutrition_targets.hydration_l_per_day} L/dia</div>
          <div><span className="label block">Kcal off day</span>{p.nutrition_targets.total_kcal_target_off_day}</div>
          <div><span className="label block">Kcal skate day</span>{p.nutrition_targets.total_kcal_target_skate_day}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">Restrições e aversões</h2>
        <p className="text-xs text-muted mb-1">Hard no</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {p.food_preferences.hard_no.map((x, i) => <span key={i} className="chip" style={{ borderColor: "#e87b6b", color: "#e87b6b" }}>{x}</span>)}
        </div>
        <p className="text-xs text-muted mb-1">Texturas aversivas</p>
        <ul className="text-xs text-muted list-disc list-inside space-y-0.5 mb-3">
          {p.food_preferences.texture_aversions.map((x, i) => <li key={i}>{x.replace(/_/g, " ")}</li>)}
        </ul>
        <p className="text-xs text-muted mb-1">Não curte</p>
        <div className="flex gap-1.5 flex-wrap">
          {p.food_preferences.soft_dislikes.map((x, i) => <span key={i} className="chip">{x}</span>)}
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">Medical flags ({p.medical_flags.length})</h2>
        <ul className="text-xs text-muted space-y-0.5">
          {p.medical_flags.map((f, i) => <li key={i}>• {f.replace(/_/g, " ")}</li>)}
        </ul>
      </div>

      <div className="card text-xs text-muted">
        Perfil carregado de <code className="text-text">data/profiles/person_a.yml</code>. Síntese clínica completa em <code className="text-text">data/profiles/person_a_clinical.md</code>.
      </div>
    </div>
  );
}
