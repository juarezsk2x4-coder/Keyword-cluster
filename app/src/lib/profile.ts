import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";
import type { PersonId, PersonProfile } from "./types";

const PERSON_A_PATH = path.join(process.cwd(), "..", "data", "profiles", "person_a.yml");
const PERSON_B_PATH = path.join(process.cwd(), "..", "data", "profiles", "person_b.yml");

// Numeric profile fields are allowed to still be the literal "FILL_IN"
// placeholder — that's the expected, documented state of a template nobody
// has filled in yet (see wife/LEIA-ME.md), not a bug. What this schema
// actually guards against is a real structural problem: a missing section,
// an array field that isn't an array, a completely wrong shape — the class
// of error that would otherwise surface as an opaque crash deep inside an
// unrelated server action (e.g. `.join()` on something that isn't an array).
const numericOrUnfilled = z.union([z.number(), z.literal("FILL_IN")]);
const stringField = z.union([z.string(), z.null()]).transform((v) => v ?? "FILL_IN");
const stringArray = z.array(z.string()).default([]);

const PersonProfileSchema = z.object({
  name: stringField,
  age_years: numericOrUnfilled,
  height_cm: numericOrUnfilled,
  weight_kg: numericOrUnfilled,
  body_fat_pct: z.union([z.number(), z.literal("FILL_IN"), z.null(), z.undefined()]).optional(),
  estimated_bmr_kcal: numericOrUnfilled,
  goals: z.object({
    primary: stringField,
    performance_focus: stringArray,
    philosophical: stringField,
  }),
  nutrition_targets: z.object({
    protein_g_per_day: numericOrUnfilled,
    hydration_l_per_day: numericOrUnfilled,
    total_kcal_target_off_day: numericOrUnfilled,
    total_kcal_target_skate_day: numericOrUnfilled,
  }),
  medical_flags: stringArray,
  food_preferences: z.object({
    hard_no: stringArray,
    texture_aversions: stringArray,
    soft_dislikes: stringArray,
  }),
  has_custom_meal_plan: z.boolean().optional(),
  clinical_brief_path: z.string().optional(),
  location: z
    .object({
      city: z.string(),
      state: z.string(),
      country: z.string(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
});

function loadFromYaml(profilePath: string): PersonProfile {
  const raw = fs.readFileSync(profilePath, "utf-8");
  const parsed = yaml.load(raw) as Record<string, unknown>;

  const result = PersonProfileSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Profile file ${profilePath} doesn't match the expected shape. This usually means a ` +
        `section is missing or a field's type was changed by hand-editing.\n${issues}`
    );
  }
  // The union types above are for validation only — call sites still expect
  // the plain PersonProfile shape (with FILL_IN strings where numbers
  // should eventually go, exactly as before this schema existed).
  return result.data as unknown as PersonProfile;
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
