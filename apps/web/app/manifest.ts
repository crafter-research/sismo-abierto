import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sismo Abierto",
    short_name: "Sismo",
    description:
      "Actividad sísmica oficial de Perú y Colombia con datos trazables del IGP y el SGC.",
    start_url: "/peru",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    lang: "es-419",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
