import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs before protected routes:
 *  - refreshes the Supabase Auth session cookie (when Supabase is configured);
 *  - fast-redirects signed-out visitors away from dashboards (the pages and
 *    API routes still perform the authoritative role checks server-side).
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let signedIn: boolean;

  if (url && anon && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.DATA_BACKEND !== "local") {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } else {
    signedIn = request.cookies.has("theos_session");
  }

  if (!signedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*", "/driver/:path*", "/account/:path*"],
};
