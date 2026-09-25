import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";

// Rebuilt hourly so newly approved partner restaurants appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.siteUrl;
  const pages = ["", "/menu", "/order", "/delivery", "/about", "/lounge", "/events", "/specials", "/contact", "/faq", "/restaurants", "/network", "/partners", "/drive", "/privacy", "/terms"];
  const restaurants = await getDb().list("restaurants", { status: "active", is_anchor: false });
  const now = new Date();
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: (p === "" || p === "/menu" || p === "/specials" ? "daily" : "weekly") as "daily" | "weekly", priority: p === "" ? 1 : p === "/menu" || p === "/order" ? 0.9 : 0.6 })),
    ...restaurants.map((r) => ({ url: `${base}/restaurants/${r.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
