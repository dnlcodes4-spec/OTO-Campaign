import type { NextConfig } from "next";
import { SUPABASE_URL } from "./lib/supabase/env";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy fallback for browsers that don't honor CSP's frame-ancestors below.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

// No inline scripts/styles anywhere in the app (Tailwind is compiled at
// build time, no next/script or dangerouslySetInnerHTML usage), so both
// policies below can stay free of 'unsafe-inline'.
const publicCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  // i.ytimg.com is the VideoFacade thumbnail; the iframe itself is only
  // injected after a click, hence frame-src below rather than always-on.
  "img-src 'self' https://res.cloudinary.com https://i.ytimg.com data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// /admin needs the Supabase browser client (auth) and a direct signed
// upload to Cloudinary's API (GalleryManager) — neither exists on the
// public site, so it stays out of publicCsp's connect-src.
const adminCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' https://res.cloudinary.com data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_URL} https://api.cloudinary.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/((?!admin).*)", headers: [{ key: "Content-Security-Policy", value: publicCsp }] },
      { source: "/admin/:path*", headers: [{ key: "Content-Security-Policy", value: adminCsp }] },
    ];
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
