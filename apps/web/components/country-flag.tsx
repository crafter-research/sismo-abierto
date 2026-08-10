import type { EventProviderId } from "@sismo/contracts";

export function CountryFlag({
  provider,
  className = "h-3.5 w-5",
}: {
  provider: EventProviderId;
  className?: string;
}) {
  const country = provider === "sgc" ? "Colombia" : "Perú";
  return (
    <svg
      viewBox="0 0 24 16"
      role="img"
      aria-label={`Bandera de ${country}`}
      className={`shrink-0 overflow-hidden rounded-[2px] border border-black/10 ${className}`}
    >
      {provider === "sgc" ? (
        <>
          <path fill="#FCD116" d="M0 0h24v8H0z" />
          <path fill="#003893" d="M0 8h24v4H0z" />
          <path fill="#CE1126" d="M0 12h24v4H0z" />
        </>
      ) : (
        <>
          <path fill="#D91023" d="M0 0h8v16H0zM16 0h8v16h-8z" />
          <path fill="#fff" d="M8 0h8v16H8z" />
        </>
      )}
    </svg>
  );
}
