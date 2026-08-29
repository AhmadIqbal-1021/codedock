import { MetadataRoute } from "next";
import { getLiveTools } from "@/constants/all-tools";
import { CATEGORIES } from "@/constants/categories";
import { SITE_URL } from "@/lib/site";

/**
 * Every live tool page — and now every category page — gets its own
 * sitemap entry so Google has a crawlable path to each one. A hardcoded,
 * unlisted sitemap defeats the point of having individual pages at all.
 * Add a tool to ALL_TOOLS with status: "live" and it appears here
 * automatically; same for a new entry in CATEGORIES.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = getLiveTools().map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...toolEntries,
    ...categoryEntries,
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
