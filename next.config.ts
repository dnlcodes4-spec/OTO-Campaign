import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy fallback for browsers that don't honor CSP's frame-ancestors below.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

// Content-Security-Policy is not set here: it needs a fresh nonce per
// request (Next.js's own inline hydration scripts are blocked outright
// without one — see proxy.ts), and next.config.ts's headers() runs once
// at build/start, not per request. proxy.ts builds and sets it instead.
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Standalone output is for self-hosted deploys only. Vercel's build
  // pipeline expects the default output and fails on standalone traces.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    // Gallery photos never change once uploaded (a caption edit doesn't
    // touch the file), so the optimizer's cache can be held far longer
    // than the framework default without ever serving a stale image.
    minimumCacheTTL: 2592000,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // Scoped to our own Cloudinary account: res.cloudinary.com is a
        // shared multi-tenant host, so an unscoped pathname would let
        // next/image proxy and re-serve any other account's assets too.
        // Falls back to the real cloud name (not a secret — it's visible
        // in every image URL already) in case a hosting environment
        // doesn't propagate custom env vars into the build step itself,
        // only into the running app's process.
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME ?? "dgols34tu"}/**`,
      },
    ],
  },
};

export default nextConfig;
