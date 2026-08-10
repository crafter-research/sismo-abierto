"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(interval);
  }, [router, seconds]);
  return (
    <span className="font-mono text-[10px] text-gray-700">
      Actualización automática cada {seconds} s
    </span>
  );
}
