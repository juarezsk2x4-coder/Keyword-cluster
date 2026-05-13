import { loadPersonA } from "@/lib/profile";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";

export default async function ProfilePage() {
  const p = loadPersonA();
  const lang = await getLang();
  const tr = t(lang);

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">{p.name}</h1>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="label block">{tr.profile_age}</span>{p.age_years}</div>
          <div><span className="label block">{tr.profile_height}</span>{p.height_cm} cm</div>
          <div><span className="label block">{tr.profile_weight}</span>{p.weight_kg} kg</div>
          <div><span className="label block">{tr.profile_bodyfat}</span>{p.body_fat_pct}</div>
          <div><span className="label block">{tr.profile_bmr}</span>{p.estimated_bmr_kcal} kcal</div>
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">{tr.profile_goal}</h2>
        <p className="text-sm mb-1">{p.goals.primary}</p>
        <p className="text-xs text-muted">{p.goals.philosophical}</p>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {p.goals.performance_focus.map((f, i) => <span key={i} className="chip">{f}</span>)}
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">{tr.profile_targets}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="label block">{tr.profile_target_protein}</span>{p.nutrition_targets.protein_g_per_day} g/dia</div>
          <div><span className="label block">{tr.profile_target_hydration}</span>{p.nutrition_targets.hydration_l_per_day} L/dia</div>
          <div><span className="label block">{tr.profile_target_kcal_off}</span>{p.nutrition_targets.total_kcal_target_off_day}</div>
          <div><span className="label block">{tr.profile_target_kcal_skate}</span>{p.nutrition_targets.total_kcal_target_skate_day}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">{tr.profile_restrictions}</h2>
        <p className="text-xs text-muted mb-1">{tr.profile_hard_no}</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {p.food_preferences.hard_no.map((x, i) => <span key={i} className="chip" style={{ borderColor: "#e87b6b", color: "#e87b6b" }}>{x}</span>)}
        </div>
        <p className="text-xs text-muted mb-1">{tr.profile_textures}</p>
        <ul className="text-xs text-muted list-disc list-inside space-y-0.5 mb-3">
          {p.food_preferences.texture_aversions.map((x, i) => <li key={i}>{x.replace(/_/g, " ")}</li>)}
        </ul>
        <p className="text-xs text-muted mb-1">{tr.profile_dislikes}</p>
        <div className="flex gap-1.5 flex-wrap">
          {p.food_preferences.soft_dislikes.map((x, i) => <span key={i} className="chip">{x}</span>)}
        </div>
      </div>

      <div className="card">
        <h2 className="label mb-2">{tr.profile_medical_flags} ({p.medical_flags.length})</h2>
        <ul className="text-xs text-muted space-y-0.5">
          {p.medical_flags.map((f, i) => <li key={i}>• {f.replace(/_/g, " ")}</li>)}
        </ul>
      </div>

      <div className="card text-xs text-muted">
        {lang === "en"
          ? <>Profile loaded from <code className="text-text">data/profiles/person_a.yml</code>. Full clinical synthesis in <code className="text-text">data/profiles/person_a_clinical.md</code>.</>
          : <>Perfil carregado de <code className="text-text">data/profiles/person_a.yml</code>. Síntese clínica completa em <code className="text-text">data/profiles/person_a_clinical.md</code>.</>}
      </div>
    </div>
  );
}
