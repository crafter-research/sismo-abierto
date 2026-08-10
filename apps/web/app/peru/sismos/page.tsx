import type { Metadata } from "next";
import { CountryCatalogPage } from "../../sismos/page";

export const metadata: Metadata = {
  title: "Catálogo de sismos en Perú",
  description:
    "Explora y filtra los sismos registrados en Perú por el IGP y CENSIS, con magnitud, profundidad, fecha, mapa y procedencia.",
  alternates: { canonical: "/peru/sismos" },
};

export default function PeruCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CountryCatalogPage providerOverride="igp" searchParams={searchParams} />
  );
}
