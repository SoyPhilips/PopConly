import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
