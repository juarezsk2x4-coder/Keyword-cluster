import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { PersonId, PersonProfile } from "./types";

const PERSON_A_PATH = path.join(process.cwd(), "..", "data", "profiles", "person_a.yml");
const PERSON_B_PATH = path.join(process.cwd(), "..", "data", "profiles", "person_b.yml");

function loadFromYaml(profilePath: string): PersonProfile {
  const raw = fs.readFileSync(profilePath, "utf-8");
  const parsed = yaml.load(raw) as Record<string, unknown>;

  return {
    name: parsed.name as string,
    age_years: parsed.age_years as number,
    height_cm: parsed.height_cm as number,
    weight_kg: parsed.weight_kg as number,
    body_fat_pct: parsed.body_fat_pct as number,
    estimated_bmr_kcal: parsed.estimated_bmr_kcal as number,
    goals: parsed.goals as PersonProfile["goals"],
    nutrition_targets: parsed.nutrition_targets as PersonProfile["nutrition_targets"],
    medical_flags: parsed.medical_flags as string[],
    food_preferences: parsed.food_preferences as PersonProfile["food_preferences"],
  };
}

export function loadPersonA(): PersonProfile {
  return loadFromYaml(PERSON_A_PATH);
}

export function loadPersonB(): PersonProfile {
  return loadFromYaml(PERSON_B_PATH);
}

export function loadProfile(personId: PersonId): PersonProfile {
  return personId === "person_b" ? loadPersonB() : loadPersonA();
}
