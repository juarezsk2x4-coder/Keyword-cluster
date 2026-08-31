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
    // Not forced on always: local phone-over-LAN testing (see README "Mobile
    // setup") uses plain http://<lan-ip>:3000, which a Secure cookie would
    // never be sent back on.
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
