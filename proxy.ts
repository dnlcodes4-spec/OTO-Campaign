import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isOtoAdmin } from "@/lib/admin/authorize";
import { isNextInternalSignal } from "@/lib/next-internal-errors";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/*
 * A per-request nonce lets script-src/style-src stay locked to 'self' plus
 * the nonce instead of 'unsafe-inline'. Next.js's own inline hydration/RSC
 * bootstrap scripts need that nonce present on every HTML response or the
 * browser blocks them outright — no error banner, just a page that never
 * finishes hydrating, so no click handler ever attaches (this is what was
 * breaking admin login: the button never left "Sign in"). Nonce-based CSP
 * only reaches a page's own script tags if that page is dynamically
 * rendered per request; every route this proxy matches already is, except
 * /admin/login, which opts in explicitly via `export const dynamic`.
 *
 * /admin needs the Supabase browser client (auth) and a direct signed
 * upload to Cloudinary's API (GalleryManager) — neither exists on the
 * public site, so it keeps a separate, slightly wider connect-src/img-src.
 */
function buildCsp(pathname: string, nonce: string) {
  const isAdmin = pathname.startsWith("/admin");
  const isDev = process.env.NODE_ENV === "development";
  const connectSrc = isAdmin ? `'self' ${SUPABASE_URL} https://api.cloudinary.com` : "'self'";
  const imgSrc = isAdmin
    ? "'self' https://res.cloudinary.com data: blob:"
    : "'self' https://res.cloudinary.com https://i.ytimg.com data: blob:";
  // i.ytimg.com is the VideoFacade thumbnail (public site only); the
  // iframe itself is only injected after a click, hence frame-src rather
  // than always-on, and only on the public site.
  const frameSrc = isAdmin ? "" : " frame-src https://www.youtube-nocookie.com;";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'nonce-${nonce}';
    img-src ${imgSrc};
    font-src 'self';
    connect-src ${connectSrc};${frameSrc}
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  return cspHeader.replace(/\s{2,}/g, " ").trim();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(pathname, nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const nextOptions = { request: { headers: requestHeaders } };

  if (!isAdminRoute) {
    const response = NextResponse.next(nextOptions);
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  let response = NextResponse.next(nextOptions);
  response.headers.set("Content-Security-Policy", csp);
  let isAuthorized = false;

  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next(nextOptions);
            response.headers.set("Content-Security-Policy", csp);
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    isAuthorized = user ? await isOtoAdmin(user.id) : false;
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    // A malformed Supabase client (e.g. a missing env var) throws during
    // construction. This gates every /admin/* request, so it must fail
    // closed (deny) rather than let the exception surface as a generic
    // middleware crash.
    console.error("Admin auth check failed in proxy:", error);
    isAuthorized = false;
  }

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    if (isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

/*
 * Widened from the original admin-only matcher: the CSP nonce needs to
 * reach every HTML page, not just /admin/*, or the public site's own
 * inline hydration scripts get blocked the same way admin login's did.
 * The admin auth-gating logic above still only activates for /admin
 * paths internally. Static assets, API routes, and metadata files are
 * excluded since they carry no inline scripts of their own; prefetch
 * requests are excluded per Next's own CSP guidance, since a prefetched
 * nonce would never match the nonce the eventual real navigation gets.
 */
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
