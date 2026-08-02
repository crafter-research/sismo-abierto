"use client";

import { useEffect, useState } from "react";

export interface ReportSwitchGroup {
  label: string;
  items: Array<{ href: string; label: string }>;
}

export function ReportSwitcher({
  currentHref,
  groups,
}: {
  currentHref: string;
  groups: ReportSwitchGroup[];
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-gray-800 sm:flex-row sm:items-center sm:gap-2">
      <span className="shrink-0">Cambiar reporte</span>
      <select
        aria-label="Cambiar reporte"
        className="min-w-0 rounded border border-gray-300 bg-background-100 px-3 py-2 font-medium text-sm text-gray-1000 outline-none hover:border-gray-600 focus:border-gray-1000"
        disabled={!ready}
        onChange={(event) => window.location.assign(event.currentTarget.value)}
        value={currentHref}
      >
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.items.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
