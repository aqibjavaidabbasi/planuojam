import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  assetPrefix: "/",
  images:{
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'strapi.planuojam.lt',
      }
    ]
  }
};

export default nextConfig;
