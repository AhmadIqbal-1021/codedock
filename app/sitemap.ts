import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://codedock.com",
      lastModified: new Date(),
    },
    {
      url: "https://codedock.com/tools",
      lastModified: new Date(),
    },
  ];
}