import type { MetadataRoute } from "next";
import { archiveArticles } from "@/lib/archive/data";
import { projects } from "@/constants/projects";
import { systemsRegistry } from "@/lib/portfolio/evidence";

const origin = "https://shantanusoam.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/blog", "/inspo", "/worth-your-time", "/raq", "/systems", "/learning"];
  return [
    ...routes.map((route) => ({ url: `${origin}${route}`, lastModified: new Date("2026-08-12") })),
    ...archiveArticles.map((article) => ({ url: `${origin}/blog/${article.slug}`, lastModified: new Date(article.updatedAt) })),
    ...projects.map((project) => ({ url: `${origin}${project.url}`, lastModified: new Date("2026-08-12") })),
    ...systemsRegistry.map((entry) => ({ url: `${origin}/systems/${entry.slug}`, lastModified: new Date("2026-08-12") })),
  ];
}
