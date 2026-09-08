import "server-only";

import { cookies } from "next/headers";
import { env } from "~/env";
import type { Usuario } from "~/server/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
} from "./session-token";

export async function createSession(
  user: Pick<Usuario, "id" | "username" | "passwordVersion">,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await signSessionToken({
    userId: user.id,
    username: user.username,
    passwordVersion: user.passwordVersion,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
