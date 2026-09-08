import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "~/lib/auth/session-token";
import {
  AUTHENTICATED_USER_HEADER,
  serializeAuthenticatedUser,
} from "~/lib/auth/middleware-user";
import { verifySessionUser } from "~/lib/auth/session-user";
import { usuarioRepository } from "~/server/db/repositories/usuario";

const PUBLIC_PATHS = new Set(["/login", "/api/health"]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  // Never trust a value supplied by the browser for this internal handoff.
  requestHeaders.delete(AUTHENTICATED_USER_HEADER);
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  let authenticatedUser = null;
  if (session) {
    try {
      const user = await usuarioRepository.findById(session.userId);
      authenticatedUser = verifySessionUser(session, user);
    } catch {
      authenticatedUser = null;
    }
  }

  if (!authenticatedUser) {
    const loginUrl = new URL("/login", request.url);
    if (request.method === "GET")
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  requestHeaders.set(
    AUTHENTICATED_USER_HEADER,
    serializeAuthenticatedUser(authenticatedUser),
  );
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
