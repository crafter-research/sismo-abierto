"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="rounded border border-official px-2 py-1 text-xs font-medium text-official hover:bg-official-soft"
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
      >
        Copiar enlace
      </button>
      <span role="status" aria-live="polite" className="text-xs text-gray-600">
        {copied ? "Enlace copiado" : ""}
      </span>
    </span>
  );
}
