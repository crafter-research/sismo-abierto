import { LESSONS } from "@sismo/aula-content";
import type { MetadataRoute } from "next";

const BASE_URL = "https://sismo.crafter.run";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastContentUpdate = new Date("2026-08-10T00:00:00.000Z");
  const sgcEnabled =
    process.env.SISMO_SGC_PROVIDER === "true" ||
    process.env.NODE_ENV === "test";
  const routes = [
    { path: "/peru", priority: 1, changeFrequency: "hourly" as const },
    {
      path: "/peru/sismos",
      priority: 0.9,
      changeFrequency: "hourly" as const,
    },
    { path: "/aula", priority: 0.8, changeFrequency: "monthly" as const },
    {
      path: "/aula/comparador",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/aula/laboratorio",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/volcanes",
      priority: 0.7,
      changeFrequency: "daily" as const,
    },
    {
      path: "/verifica",
      priority: 0.7,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/verifica/metodologia",
      priority: 0.6,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/developers",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    { path: "/api", priority: 0.6, changeFrequency: "monthly" as const },
    ...(sgcEnabled
      ? [
          {
            path: "/colombia",
            priority: 1,
            changeFrequency: "hourly" as const,
          },
          {
            path: "/colombia/sismos",
            priority: 0.9,
            changeFrequency: "hourly" as const,
          },
        ]
      : []),
  ];
  return [
    ...routes.map((route) => ({
      url: `${BASE_URL}${route.path}`,
      lastModified: lastContentUpdate,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...LESSONS.map((lesson) => ({
      url: `${BASE_URL}/aula/${lesson.slug}`,
      lastModified: lastContentUpdate,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
