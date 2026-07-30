import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Logo } from "../components/logo";
import { ThemeToggle } from "../components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sismo.crafter.run"),
  title: {
    default: "Sismo Abierto",
    template: "%s · Sismo Abierto",
  },
  description:
    "Del epicentro oficial a cómo se movió realmente el suelo. Proyecto comunitario sobre datos públicos del IGP.",
  openGraph: {
    siteName: "Sismo Abierto",
    type: "website",
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const NAV_ITEMS = [
  { href: "/", label: "Sismos" },
  { href: "/volcanes", label: "Volcanes" },
  { href: "/aula", label: "Aula" },
  { href: "/verifica", label: "Verifica" },
  { href: "/developers", label: "Developers" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="border-gray-200 border-b bg-background-100">
            <div className="mx-auto flex h-12 max-w-6xl items-center gap-x-6 px-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold text-[15px] text-gray-1000 tracking-tight"
              >
                <Logo size={22} />
                Sismo Abierto
              </Link>
              <nav
                aria-label="Navegación principal"
                className="flex flex-wrap items-center gap-x-4 text-[13px] text-gray-900"
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:text-gray-1000"
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href="https://github.com/crafter-research/sismo-abierto"
                  className="hover:text-gray-1000"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </nav>
              <span className="ml-auto hidden font-mono text-[11px] text-gray-800 lg:block">
                Proyecto comunitario · Fuente: IGP · No es un canal de alerta
              </span>
              <span className="ml-auto lg:ml-0">
                <ThemeToggle />
              </span>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5">
            {children}
          </main>
          <footer className="border-gray-200 border-t px-4 py-3 text-center font-mono text-[11px] text-gray-800">
            Datos consultados en las fuentes públicas del Instituto Geofísico
            del Perú · cada valor indica fuente, hora de consulta y limitaciones
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
