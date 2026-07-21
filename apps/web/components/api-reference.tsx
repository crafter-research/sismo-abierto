"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ApiReference() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <p className="p-6 font-mono text-[13px] text-gray-800">
        Cargando referencia…
      </p>
    );
  }
  return (
    <ApiReferenceReact
      configuration={{
        url: "/api/v1/openapi.json",
        theme: "default",
        hideDarkModeToggle: true,
        forceDarkModeState: resolvedTheme === "dark" ? "dark" : "light",
        hideClientButton: true,
        metaData: { title: "Sismo Abierto API" },
      }}
    />
  );
}
