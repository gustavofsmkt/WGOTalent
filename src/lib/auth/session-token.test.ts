import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: { SESSION_SECRET: "test-session-secret-with-at-least-32-chars" },
}));

import { signSessionToken, verifySessionToken } from "./session-token";

function payload(expiresAt: number) {
  const now = Math.floor(Date.now() / 1000);
  return {
    userId: "11111111-1111-4111-8111-111111111111",
    username: "admin",
    passwordVersion: 1,
    issuedAt: now,
    expiresAt,
  };
}

describe("stateless session token", () => {
  it("round-trips an authenticated session", async () => {
    const expected = payload(Math.floor(Date.now() / 1000) + 60);
    const token = await signSessionToken(expected);

    await expect(verifySessionToken(token)).resolves.toEqual(expected);
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken(
      payload(Math.floor(Date.now() / 1000) + 60),
    );
    const [encodedPayload, signature] = token.split(".");
    const firstCharacter = encodedPayload?.at(0);
    const tamperedPayload = `${firstCharacter === "A" ? "B" : "A"}${encodedPayload?.slice(1)}`;

    await expect(
      verifySessionToken(`${tamperedPayload}.${signature}`),
    ).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSessionToken(
      payload(Math.floor(Date.now() / 1000) - 1),
    );

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});
