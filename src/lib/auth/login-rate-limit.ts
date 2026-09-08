import "server-only";

const MAX_PAIR_FAILURES = 5;
const MAX_IP_FAILURES = 50;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_KEYS = 1_000;

interface AttemptWindow {
  failures: number;
  startedAt: number;
}

export interface LoginRateLimitKey {
  value: string;
  maxFailures: number;
}

const globalForLoginAttempts = globalThis as typeof globalThis & {
  __wgoLoginAttempts?: Map<string, AttemptWindow>;
};

const attempts =
  globalForLoginAttempts.__wgoLoginAttempts ?? new Map<string, AttemptWindow>();
globalForLoginAttempts.__wgoLoginAttempts = attempts;

export function getLoginAttemptKeys(
  requestHeaders: Pick<Headers, "get">,
  username: string,
  fallbackClientAddress?: string,
): LoginRateLimitKey[] | null {
  // Production exposes the app only on loopback behind Nginx Proxy Manager.
  // Nginx appends the address it connected from to the right of XFF, so the
  // rightmost value cannot be selected by the external client.
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const forwardedAddresses = forwardedFor?.split(",") ?? [];
  const trustedForwardedAddress = forwardedAddresses.at(-1)?.trim();
  const resolvedClientAddress =
    trustedForwardedAddress ||
    requestHeaders.get("x-real-ip")?.trim() ||
    fallbackClientAddress;
  if (!resolvedClientAddress) return null;
  const clientAddress = resolvedClientAddress.slice(0, 128);

  return [
    { value: `ip:${clientAddress}`, maxFailures: MAX_IP_FAILURES },
    {
      value: `pair:${clientAddress}:${username}`,
      maxFailures: MAX_PAIR_FAILURES,
    },
  ];
}

function removeExpired(now: number): void {
  for (const [key, entry] of attempts) {
    if (now - entry.startedAt >= WINDOW_MS) attempts.delete(key);
  }
}

function ensureCapacity(now: number): void {
  if (attempts.size < MAX_TRACKED_KEYS) return;
  removeExpired(now);
  if (attempts.size < MAX_TRACKED_KEYS) return;
  const oldestKey = attempts.keys().next().value as string | undefined;
  if (oldestKey) attempts.delete(oldestKey);
}

export function checkLoginRateLimit(
  keys: LoginRateLimitKey[],
  now = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  for (const key of keys) {
    const entry = attempts.get(key.value);
    if (!entry) continue;
    const elapsed = now - entry.startedAt;
    if (elapsed >= WINDOW_MS) {
      attempts.delete(key.value);
      continue;
    }
    if (entry.failures >= key.maxFailures) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((WINDOW_MS - elapsed) / 1000),
      };
    }
  }
  return { allowed: true };
}

export function reserveLoginAttempt(
  keys: LoginRateLimitKey[],
  now = Date.now(),
): void {
  for (const key of keys) {
    const current = attempts.get(key.value);
    if (!current || now - current.startedAt >= WINDOW_MS) {
      ensureCapacity(now);
      attempts.set(key.value, { failures: 1, startedAt: now });
      continue;
    }
    current.failures += 1;
  }
}

export function clearLoginAttempts(keys: LoginRateLimitKey[]): void {
  for (const key of keys) attempts.delete(key.value);
}
