import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: "standalone",
  assetPrefix: "/",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'strapi.planuojam.lt',
      }
    ]
  },
  // Increase build timeout for static generation
  staticPageGenerationTimeout: 120, // 2 minutes instead of default 60 seconds
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
