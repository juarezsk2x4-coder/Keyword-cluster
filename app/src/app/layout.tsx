import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plano A",
  description: "Meal plan tracker — Person A test app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <nav className="sticky top-0 z-10 bg-bg border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
            <Link href="/" className="font-semibold tracking-tight">Plano A</Link>
            <div className="ml-auto flex gap-3 text-sm text-muted">
              <Link href="/" className="hover:text-text">Hoje</Link>
              <Link href="/shopping" className="hover:text-text">Compras</Link>
              <Link href="/profile" className="hover:text-text">Perfil</Link>
              <Link href="/history" className="hover:text-text">Histórico</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-4 py-6 pb-24">{children}</main>
      </body>
    </html>
  );
}
