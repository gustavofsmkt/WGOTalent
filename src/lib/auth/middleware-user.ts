import type { AuthenticatedUser } from "./session-user";

export const AUTHENTICATED_USER_HEADER = "x-wgo-authenticated-user";

/**
 * This header is request-internal: middleware always removes any client value
 * and only sets it after checking the signed cookie against the database.
 */
export function serializeAuthenticatedUser(user: AuthenticatedUser): string {
  return encodeURIComponent(JSON.stringify(user));
}

export function parseAuthenticatedUser(
  value: string | null,
): AuthenticatedUser | null {
  if (!value || value.length > 2_048) return null;

  try {
    const parsed = JSON.parse(
      decodeURIComponent(value),
    ) as Partial<AuthenticatedUser>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      username: parsed.username,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}
