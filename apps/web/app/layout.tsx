import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { GlobalProviderSwitcher } from "../components/global-provider-switcher";
import { Logo } from "../components/logo";
import { ThemeToggle } from "../components/theme-toggle";
import "./globals.css";

const SGC_PUBLIC =
  process.env.SISMO_SGC_PROVIDER === "true" || process.env.NODE_ENV === "test";

export const metadata: Metadata = {
  metadataBase: new URL("https://sismo.crafter.run"),
  title: {
    default: "Sismo Abierto",
    template: "%s · Sismo Abierto",
  },
  description: SGC_PUBLIC
    ? "Sismos oficiales de Perú y Colombia con datos públicos del IGP y el SGC, mapas, catálogos, API y CLI con procedencia trazable."
    : "Sismos oficiales de Perú con datos públicos del IGP, mapas, catálogos, API y CLI con procedencia trazable.",
  applicationName: "Sismo Abierto",
  keywords: [
    "sismos Perú",
    "último sismo",
    "IGP",
    ...(SGC_PUBLIC
      ? ["sismos Colombia", "Servicio Geológico Colombiano", "SGC"]
      : []),
    "terremotos",
    "actividad sísmica",
  ],
  authors: [{ name: "Crafter Research", url: "https://crafter.run" }],
  creator: "Crafter Research",
  publisher: "Crafter Research",
  category: "science",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    siteName: "Sismo Abierto",
    type: "website",
    locale: "es_419",
    title: SGC_PUBLIC
      ? "Sismo Abierto · Perú y Colombia"
      : "Sismo Abierto · Perú",
    description: SGC_PUBLIC
      ? "Actividad sísmica oficial de Perú y Colombia con datos trazables del IGP y el SGC."
      : "Actividad sísmica oficial de Perú con datos trazables del IGP.",
  },
  twitter: {
    card: "summary_large_image",
    title: SGC_PUBLIC
      ? "Sismo Abierto · Perú y Colombia"
      : "Sismo Abierto · Perú",
    description: SGC_PUBLIC
      ? "Actividad sísmica oficial de Perú y Colombia con datos trazables del IGP y el SGC."
      : "Actividad sísmica oficial de Perú con datos trazables del IGP.",
  },
};

const NAV_ITEMS = [
  { href: "/peru", label: "Sismos" },
  { href: "/volcanes", label: "Volcanes" },
  { href: "/aula", label: "Aula" },
  { href: "/verifica", label: "Verifica" },
  { href: "/developers", label: "Developers" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const sgcEnabled = SGC_PUBLIC;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sismo Abierto",
    url: "https://sismo.crafter.run",
    description: SGC_PUBLIC
      ? "Actividad sísmica oficial de Perú y Colombia con procedencia trazable."
      : "Actividad sísmica oficial de Perú con procedencia trazable.",
    inLanguage: "es-419",
    publisher: {
      "@type": "Organization",
      name: "Crafter Research",
      url: "https://crafter.run",
    },
  };
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header
            className="relative z-50 border-gray-200 border-b bg-background-100"
            data-testid="site-header"
          >
            <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4 md:gap-x-6">
              <Link
                href="/peru"
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
              <div className="ml-auto hidden xl:block">
                <GlobalProviderSwitcher sgcEnabled={sgcEnabled} />
              </div>
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
                  <div className="border-gray-200 border-t px-3 py-2">
                    <GlobalProviderSwitcher sgcEnabled={sgcEnabled} />
                  </div>
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
            Datos consultados en fuentes sismológicas oficiales · cada valor
            indica fuente, hora de consulta y limitaciones
          </footer>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
