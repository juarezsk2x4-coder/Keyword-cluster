"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { PersonId } from "@/lib/types";

export async function setPerson(personId: PersonId) {
  const c = await cookies();
  c.set("person", personId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
