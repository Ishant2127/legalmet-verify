import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LegalMet Verify Nexus",
    short_name: "LegalMet",
    description: "National instrument trust, verification and compliance platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090a",
    theme_color: "#d9a441",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
