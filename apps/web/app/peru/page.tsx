import type { Metadata } from "next";
import { CountryHomePage } from "../page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Últimos sismos en Perú",
  description:
    "Consulta el último sismo en Perú y la actividad sísmica oficial del IGP con magnitud, profundidad, mapa, estaciones y procedencia.",
  alternates: { canonical: "/peru" },
  openGraph: {
    title: "Últimos sismos en Perú · Sismo Abierto",
    description:
      "Actividad sísmica oficial del Perú con datos trazables del IGP.",
    url: "/peru",
    locale: "es_PE",
  },
};

export default function PeruPage() {
  return <CountryHomePage provider="igp" />;
}
