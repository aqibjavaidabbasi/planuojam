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
    ],
    // AVIF first: ~30% smaller than WebP at the same quality, transparently negotiated.
    formats: ['image/avif', 'image/webp'],
    // Next emits one srcSet candidate per width, each embedding the full URL-encoded Strapi
    // URL (~145 bytes). With the 8 default deviceSizes, a listing grid of 467 images spent
    // 674 KB of HTML on srcSet alone — offering 3840px variants for 340px card slots.
    // These four cover mobile 1x/2x, tablet, and full-width desktop at 2x.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  // Increase build timeout for static generation
  staticPageGenerationTimeout: 120, // 2 minutes instead of default 60 seconds
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
