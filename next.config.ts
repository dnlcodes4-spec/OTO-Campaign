import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is for self-hosted deploys only. Vercel's build
  // pipeline expects the default output and fails on standalone traces.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // Scoped to our own Cloudinary account: res.cloudinary.com is a
        // shared multi-tenant host, so an unscoped pathname would let
        // next/image proxy and re-serve any other account's assets too.
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
};

export default nextConfig;
