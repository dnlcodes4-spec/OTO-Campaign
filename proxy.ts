import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isOtoAdmin } from "@/lib/admin/authorize";
import { isNextInternalSignal } from "@/lib/next-internal-errors";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAdminRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  let isAuthorized = false;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
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

export const config = {
  matcher: ["/admin/:path*"],
};
