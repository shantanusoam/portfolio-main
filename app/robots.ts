import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: "https://shantanusoam.vercel.app/sitemap.xml", host: "https://shantanusoam.vercel.app" };
}
