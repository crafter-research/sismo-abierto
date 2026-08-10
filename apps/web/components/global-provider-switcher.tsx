"use client";

import type { EventProviderId } from "@sismo/contracts";
import { usePathname } from "next/navigation";
import { ProviderSwitcher } from "./provider-switcher";

export function GlobalProviderSwitcher({
  sgcEnabled,
}: {
  sgcEnabled: boolean;
}) {
  const pathname = usePathname();
  let active: EventProviderId | undefined;
  if (pathname.startsWith("/colombia") || pathname.includes("/sgc-")) {
    active = "sgc";
  } else if (
    pathname === "/" ||
    pathname.startsWith("/peru") ||
    pathname.startsWith("/sismos")
  ) {
    active = "igp";
  }
  const surface = pathname.endsWith("/sismos") ? "catalog" : "home";
  return (
    <ProviderSwitcher
      active={active}
      surface={surface}
      compact
      sgcEnabled={sgcEnabled}
    />
  );
}
