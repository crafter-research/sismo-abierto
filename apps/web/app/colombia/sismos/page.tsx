import type { Metadata } from "next";
import { CountryCatalogPage } from "../../sismos/page";

export const metadata: Metadata = {
  title: "Catálogo de sismos en Colombia",
  description:
    "Explora y filtra los sismos registrados en Colombia por el SGC, con magnitud, profundidad, fecha, mapa y estado de revisión.",
  alternates: { canonical: "/colombia/sismos" },
  robots:
    process.env.SISMO_SGC_PROVIDER === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export default function ColombiaCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CountryCatalogPage providerOverride="sgc" searchParams={searchParams} />
  );
}
