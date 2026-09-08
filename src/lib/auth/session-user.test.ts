import { describe, expect, it } from "vitest";
import { verifySessionUser } from "./session-user";

const session = {
  userId: "11111111-1111-4111-8111-111111111111",
  username: "admin",
  passwordVersion: 1,
  issuedAt: 1,
  expiresAt: 2,
};

const user = {
  id: session.userId,
  username: session.username,
  passwordVersion: session.passwordVersion,
  createdAt: "2026-09-08T12:00:00.000Z",
  updatedAt: "2026-09-08T12:00:00.000Z",
};

describe("session user validation", () => {
  it("returns the public identity when the session still matches", () => {
    expect(verifySessionUser(session, user)).toEqual({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it("rejects a session after the password version changes", () => {
    expect(
      verifySessionUser(session, { ...user, passwordVersion: 2 }),
    ).toBeNull();
  });
});
