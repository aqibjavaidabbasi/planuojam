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
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
