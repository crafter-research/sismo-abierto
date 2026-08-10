import type { Metadata } from "next";
import { CountryHomePage } from "../page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Últimos sismos en Colombia",
  description:
    "Consulta el último sismo en Colombia y el catálogo oficial del SGC con magnitud, profundidad, mapa, intensidad y estado de revisión.",
  alternates: { canonical: "/colombia" },
  openGraph: {
    title: "Últimos sismos en Colombia · Sismo Abierto",
    description:
      "Actividad sísmica oficial de Colombia con datos trazables del SGC.",
    url: "/colombia",
    locale: "es_CO",
  },
  robots:
    process.env.SISMO_SGC_PROVIDER === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export default function ColombiaPage() {
  return <CountryHomePage provider="sgc" />;
}
