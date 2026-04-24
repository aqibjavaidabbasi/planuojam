import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://planuojam.lt").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: baseUrl,
  };
}
