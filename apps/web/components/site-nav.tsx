import Link from "next/link";
import type { ReactNode } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";

export interface NavLink {
  href: string;
  label: string;
  hint?: string;
  external?: boolean;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "links" in entry;
}

export const NAV_ENTRIES: NavEntry[] = [
  { href: "/peru", label: "Sismos" },
  { href: "/volcanes", label: "Volcanes" },
  { href: "/terreno", label: "Terreno" },
  {
    label: "Aula",
    links: [
      { href: "/aula", label: "Lecciones", hint: "Cómo se mide un sismo" },
      {
        href: "/aula/comparador",
        label: "Comparador",
        hint: "Magnitudes lado a lado",
      },
      {
        href: "/aula/laboratorio",
        label: "Laboratorio",
        hint: "Jugá con las variables",
      },
    ],
  },
  {
    label: "Verifica",
    links: [
      { href: "/verifica", label: "Informes", hint: "Predicciones auditadas" },
      {
        href: "/verifica/metodologia",
        label: "Metodología",
        hint: "Cómo se evalúa cada una",
      },
    ],
  },
  {
    label: "Datos",
    links: [
      {
        href: "/fuentes",
        label: "Estado de fuentes",
        hint: "Qué responde y qué no",
      },
      { href: "/api", label: "API", hint: "Endpoints públicos" },
      {
        href: "/developers",
        label: "Developers",
        hint: "CLI y skill de agente",
      },
      {
        href: "https://github.com/crafter-research/sismo-abierto",
        label: "GitHub",
        hint: "Código abierto",
        external: true,
      },
    ],
  },
];

function NavAnchor({ link, className }: { link: NavLink; className: string }) {
  if (link.external) {
    return (
      <a href={link.href} className={className} rel="noreferrer">
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function DesktopNav() {
  return (
    <NavigationMenu
      aria-label="Navegación principal"
      className="hidden md:flex"
      data-testid="desktop-nav"
    >
      <NavigationMenuList>
        {NAV_ENTRIES.map((entry) =>
          isGroup(entry) ? (
            <NavigationMenuItem key={entry.label}>
              <NavigationMenuTrigger>{entry.label}</NavigationMenuTrigger>
              <NavigationMenuContent className="min-w-64">
                {entry.links.map((link) => (
                  <NavigationMenuLink
                    key={link.href}
                    render={
                      link.external ? (
                        // biome-ignore lint/a11y/useAnchorContent: Base UI inyecta los hijos del enlace
                        <a href={link.href} rel="noreferrer" />
                      ) : (
                        <Link href={link.href} />
                      )
                    }
                  >
                    <span className="font-medium">{link.label}</span>
                    {link.hint ? (
                      <span className="text-muted-foreground text-xs">
                        {link.hint}
                      </span>
                    ) : null}
                  </NavigationMenuLink>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={entry.href}>
              <NavigationMenuLink
                render={<Link href={entry.href} />}
                className={navigationMenuTriggerStyle()}
              >
                {entry.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function MobileNav({ footer }: { footer?: ReactNode }) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="absolute top-[calc(100%+0.5rem)] right-0 min-w-56 overflow-hidden rounded border border-gray-300 bg-background-100 py-1 text-sm shadow-sm"
      data-testid="mobile-nav"
    >
      {NAV_ENTRIES.map((entry) =>
        isGroup(entry) ? (
          <div
            key={entry.label}
            className="border-gray-200 border-t first:border-t-0"
          >
            <p className="px-3 pt-2 text-[11px] uppercase tracking-wide text-gray-800">
              {entry.label}
            </p>
            {entry.links.map((link) => (
              <NavAnchor
                key={link.href}
                link={link}
                className="block px-3 py-2 text-gray-900 hover:bg-background-200 hover:text-gray-1000"
              />
            ))}
          </div>
        ) : (
          <NavAnchor
            key={entry.href}
            link={entry}
            className="block px-3 py-2 text-gray-900 hover:bg-background-200 hover:text-gray-1000"
          />
        ),
      )}
      {footer ? (
        <div className="border-gray-200 border-t px-3 py-2">{footer}</div>
      ) : null}
    </nav>
  );
}
