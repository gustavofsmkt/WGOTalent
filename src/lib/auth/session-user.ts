import type { SessionPayload } from "./session-token";

export interface AuthenticatedUser {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUserRecord extends AuthenticatedUser {
  passwordVersion: number;
}

/**
 * Confirms that a signed session still describes the current database user.
 * Keeping this rule shared prevents middleware and the DAL from drifting.
 */
export function verifySessionUser(
  session: SessionPayload,
  user: SessionUserRecord | null,
): AuthenticatedUser | null {
  if (
    !user ||
    user.id !== session.userId ||
    user.username !== session.username ||
    user.passwordVersion !== session.passwordVersion
  ) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
