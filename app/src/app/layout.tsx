import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getLang } from "@/lib/lang";
import { getActivePerson } from "@/lib/person";
import { t } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";
import PersonToggle from "@/components/PersonToggle";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const tr = t(lang);
  return {
    title: tr.app_name,
    description: lang === "en" ? "Meal plan + habit tracker" : "Rastreador de plano alimentar e hábitos",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2ecf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1f" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const person = await getActivePerson();
  const tr = t(lang);

  return (
    <html lang={lang === "en" ? "en" : "pt-BR"}>
      <body className="min-h-screen">
        <nav className="sticky top-0 z-10 bg-bg border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="font-semibold tracking-tight">{tr.app_name}</Link>
            <div className="ml-auto flex items-center gap-3 text-sm text-muted">
              <Link href="/" className="hover:text-text">{tr.nav.today}</Link>
              <Link href="/plan" className="hover:text-text">{tr.nav.plan}</Link>
              <Link href="/analyst" className="hover:text-text">{tr.nav.analyst}</Link>
              <Link href="/shopping" className="hover:text-text">{tr.nav.shopping}</Link>
              <Link href="/profile" className="hover:text-text">{tr.nav.profile}</Link>
              <Link href="/history" className="hover:text-text">{tr.nav.history}</Link>
              <PersonToggle current={person} lang={lang} />
              <LangToggle current={lang} />
            </div>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-4 py-6 pb-24">{children}</main>
        <SpeedInsights />
      </body>
    </html>
  );
}
