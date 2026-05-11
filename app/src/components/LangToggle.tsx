"use client";

import { useTransition } from "react";
import { setLang } from "@/app/lang-actions";
import type { Lang } from "@/lib/i18n";

export default function LangToggle({ current }: { current: Lang }) {
  const [pending, startTransition] = useTransition();
  const target: Lang = current === "pt" ? "en" : "pt";

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await setLang(target); })}
      disabled={pending}
      className="chip active:scale-95 transition-transform"
      title={current === "pt" ? "Switch to English" : "Mudar para Português"}
      aria-label="Toggle language"
    >
      {current === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
    </button>
  );
}
