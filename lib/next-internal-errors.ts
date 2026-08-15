/*
 * Next.js signals certain framework-level control flow — redirect(),
 * notFound(), and a route needing dynamic rendering because it reads
 * cookies()/headers() — by throwing an error tagged with a `digest`
 * string, rather than returning a value. A defensive try/catch around
 * server-side data loading must let these propagate untouched: catching
 * one and returning a fallback instead silently breaks the signal it
 * carries (e.g. a route that should render dynamically, or a redirect
 * that should navigate the user away, never happens).
 */
const NEXT_INTERNAL_DIGEST_PREFIXES = [
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  "DYNAMIC_SERVER_USAGE",
  "NEXT_HTTP_ERROR_FALLBACK",
];

export function isNextInternalSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && NEXT_INTERNAL_DIGEST_PREFIXES.some((prefix) => digest.startsWith(prefix));
}
