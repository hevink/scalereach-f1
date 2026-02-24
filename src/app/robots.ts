import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://scalereach.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/settings/",
          "/onboarding/",
          "/workspaces/",
          "/checkout/",
          "/verify-email/",
          "/two-factor-verify/",
          "/logout/",
          "/invite/",
          "/share/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
