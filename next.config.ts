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
      },
    ],
  },
};

export default nextConfig;
