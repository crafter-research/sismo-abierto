import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
          <header
            className="relative z-50 border-gray-200 border-b bg-background-100"
            data-testid="site-header"
          >
            <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4 md:gap-x-6">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold text-[15px] text-gray-1000 tracking-tight"
              >
                <Logo size={22} />
                Sismo Abierto
              </Link>
              <nav
                aria-label="Navegación principal"
                className="hidden items-center gap-x-4 text-[13px] text-gray-900 md:flex"
                data-testid="desktop-nav"
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
              <details className="relative ml-auto md:hidden">
                <summary
                  className="cursor-pointer list-none rounded border border-gray-300 px-2.5 py-1.5 text-[13px] font-medium text-gray-900 hover:border-gray-600"
                  data-testid="mobile-nav-toggle"
                >
                  Menú
                </summary>
                <nav
                  aria-label="Navegación móvil"
                  className="absolute top-[calc(100%+0.5rem)] right-0 min-w-48 overflow-hidden rounded border border-gray-300 bg-background-100 py-1 text-sm shadow-sm"
                  data-testid="mobile-nav"
                >
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-gray-900 hover:bg-background-200 hover:text-gray-1000"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <a
                    href="https://github.com/crafter-research/sismo-abierto"
                    className="block px-3 py-2 text-gray-900 hover:bg-background-200 hover:text-gray-1000"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                </nav>
              </details>
              <span>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
