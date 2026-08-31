"use client";

import { useTransition } from "react";
import { setPerson } from "@/app/person-actions";
import type { PersonId } from "@/lib/types";

export default function PersonToggle({ current }: { current: PersonId }) {
  const [pending, startTransition] = useTransition();

  function select(id: PersonId) {
    if (id === current) return;
    startTransition(async () => {
      await setPerson(id);
    });
  }

  return (
    <div className="flex gap-1" role="group" aria-label="Switch active profile">
      {(["person_a", "person_b"] as PersonId[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => select(id)}
          disabled={pending}
          className={`chip active:scale-95 transition-transform ${current === id ? "chip-active" : ""}`}
          aria-pressed={current === id}
        >
          {id === "person_a" ? "A" : "B"}
        </button>
      ))}
    </div>
  );
}
