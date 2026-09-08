import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { usuarioRepository } from "~/server/db/repositories/usuario";
import {
  AUTHENTICATED_USER_HEADER,
  parseAuthenticatedUser,
} from "~/lib/auth/middleware-user";
import {
  type AuthenticatedUser,
  verifySessionUser,
} from "~/lib/auth/session-user";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "~/lib/auth/session-token";

export type { AuthenticatedUser } from "~/lib/auth/session-user";

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const cookieStore = await cookies();
    const session = await verifySessionToken(
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );
    if (!session) return null;

    const headerStore = await headers();
    const middlewareUser = parseAuthenticatedUser(
      headerStore.get(AUTHENTICATED_USER_HEADER),
    );
    if (
      middlewareUser?.id === session.userId &&
      middlewareUser.username === session.username
    ) {
      return middlewareUser;
    }

    const user = await usuarioRepository.findById(session.userId);
    return verifySessionUser(session, user);
  },
);

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
