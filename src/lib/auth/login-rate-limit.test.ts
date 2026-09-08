import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getLoginAttemptKeys,
  reserveLoginAttempt,
} from "./login-rate-limit";

describe("login rate limit", () => {
  it("blocks after five attempts and releases the key after fifteen minutes", () => {
    const keys = [{ value: `test:${crypto.randomUUID()}`, maxFailures: 5 }];
    const start = 1_000_000;

    for (let count = 0; count < 5; count += 1) {
      expect(checkLoginRateLimit(keys, start)).toEqual({ allowed: true });
      reserveLoginAttempt(keys, start);
    }

    expect(checkLoginRateLimit(keys, start)).toMatchObject({ allowed: false });
    expect(checkLoginRateLimit(keys, start + 15 * 60 * 1000)).toEqual({
      allowed: true,
    });
  });

  it("clears failures after a successful login", () => {
    const keys = [{ value: `test:${crypto.randomUUID()}`, maxFailures: 5 }];
    reserveLoginAttempt(keys);
    clearLoginAttempts(keys);

    expect(checkLoginRateLimit(keys)).toEqual({ allowed: true });
  });

  it("uses the proxy-appended rightmost forwarded address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.24",
      "x-real-ip": "192.0.2.1",
    });

    expect(getLoginAttemptKeys(headers, "admin")).toEqual([
      { value: "ip:198.51.100.24", maxFailures: 50 },
      { value: "pair:198.51.100.24:admin", maxFailures: 5 },
    ]);
  });

  it("falls back to the proxy-provided real IP without X-Forwarded-For", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.25" });

    expect(getLoginAttemptKeys(headers, "admin")).toEqual([
      { value: "ip:198.51.100.25", maxFailures: 50 },
      { value: "pair:198.51.100.25:admin", maxFailures: 5 },
    ]);
  });

  it("does not create a shared unknown bucket without a trusted address", () => {
    expect(getLoginAttemptKeys(new Headers(), "admin")).toBeNull();
    expect(
      getLoginAttemptKeys(new Headers(), "admin", "local-development"),
    ).toEqual([
      { value: "ip:local-development", maxFailures: 50 },
      { value: "pair:local-development:admin", maxFailures: 5 },
    ]);
  });

  it("blocks one username after five failures without blocking peers on the same IP", () => {
    const address = `198.51.100.${crypto.randomUUID()}`;
    const headers = new Headers({ "x-real-ip": address });
    const adminKeys = getLoginAttemptKeys(headers, "admin");
    const otherUserKeys = getLoginAttemptKeys(headers, "recrutador");
    expect(adminKeys).not.toBeNull();
    expect(otherUserKeys).not.toBeNull();

    for (let count = 0; count < 5; count += 1) {
      reserveLoginAttempt(adminKeys!);
    }

    expect(checkLoginRateLimit(adminKeys!)).toMatchObject({ allowed: false });
    expect(checkLoginRateLimit(otherUserKeys!)).toEqual({ allowed: true });
  });

  it("retains a higher IP-wide ceiling for abusive username spraying", () => {
    const address = `198.51.100.${crypto.randomUUID()}`;
    const headers = new Headers({ "x-real-ip": address });

    for (let count = 0; count < 50; count += 1) {
      reserveLoginAttempt(getLoginAttemptKeys(headers, `user-${count}`)!);
    }

    expect(
      checkLoginRateLimit(getLoginAttemptKeys(headers, "fresh-user")!),
    ).toMatchObject({ allowed: false });
  });
});
