import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/verify"],
        disallow: ["/dashboard", "/instruments", "/applications", "/certificates", "/analytics", "/audit", "/integrations", "/settings", "/api"],
      },
    ],
  };
}
