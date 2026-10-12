import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/my-list", "/profile", "/watch", "/login/verify"],
      },
    ],
    sitemap: "https://popconly.tv/sitemap.xml",
  };
}
