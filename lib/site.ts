/*
 * Single source of truth for the campaign's public origin. layout.tsx,
 * sitemap.ts, robots.ts and the generated opengraph-image all read from
 * here so the production domain only ever lives in one place. Set
 * NEXT_PUBLIC_SITE_URL to override at build/deploy time (previews,
 * staging); it defaults to the production domain.
 */
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://otoforsenate.ng";

export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export const SITE_NAME = "OTO for Senate";

export const CANDIDATE_NAME = "Oluwasegun Theophilus Oladimeji";

export const CANDIDATE_RACE = "Zenith Labour Party, Oyo South Senatorial District";

export const SITE_ROUTES = ["/", "/gallery"] as const;
