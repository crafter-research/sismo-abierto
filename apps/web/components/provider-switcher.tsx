import type { EventProviderId } from "@sismo/contracts";
import Link from "next/link";
import { CountryFlag } from "./country-flag";

const PROVIDERS = [
  { id: "igp" as const, country: "Perú", agency: "IGP", slug: "peru" },
  {
    id: "sgc" as const,
    country: "Colombia",
    agency: "SGC",
    slug: "colombia",
  },
];

export function ProviderSwitcher({
  active,
  surface = "home",
  compact = false,
  sgcEnabled = true,
}: {
  active?: EventProviderId;
  surface?: "home" | "catalog";
  compact?: boolean;
  sgcEnabled?: boolean;
}) {
  const providers = sgcEnabled
    ? PROVIDERS
    : PROVIDERS.filter((provider) => provider.id !== "sgc");
  return (
    <nav
      aria-label="Seleccionar país y fuente sísmica"
      className={`flex items-center gap-1.5 ${compact ? "flex-nowrap" : "flex-wrap"}`}
    >
      {providers.map((provider) => {
        const href =
          surface === "catalog"
            ? `/${provider.slug}/sismos`
            : `/${provider.slug}`;
        const selected = active === provider.id;
        return (
          <Link
            key={provider.id}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-sm"} ${selected ? "border-gray-1000 bg-gray-1000 text-background-100" : "border-gray-300 bg-background-100 text-gray-900 hover:border-gray-500"}`}
          >
            <CountryFlag provider={provider.id} />
            <span>{provider.country}</span>
            {compact ? null : (
              <span className={selected ? "text-gray-400" : "text-gray-700"}>
                · {provider.agency}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
