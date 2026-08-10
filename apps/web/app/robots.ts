import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/cron/"],
    },
    sitemap: "https://sismo.crafter.run/sitemap.xml",
    host: "https://sismo.crafter.run",
  };
}
