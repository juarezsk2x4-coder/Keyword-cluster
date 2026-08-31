import { cookies } from "next/headers";
import type { PersonId } from "./types";

export async function getActivePerson(): Promise<PersonId> {
  const c = await cookies();
  const v = c.get("person")?.value;
  return v === "person_b" ? "person_b" : "person_a";
}
