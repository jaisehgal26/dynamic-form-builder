import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = absoluteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/f/"],
        disallow: ["/dashboard/", "/api/", "/dashboard"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
