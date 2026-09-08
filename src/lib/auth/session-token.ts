import { env } from "~/env";

export const SESSION_COOKIE_NAME = "wgo_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  userId: string;
  username: string;
  passwordVersion: number;
  issuedAt: number;
  expiresAt: number;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToString(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token || token.length > 4096) return null;
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  try {
    const signature = Uint8Array.from(
      atob(
        encodedSignature
          .replaceAll("-", "+")
          .replaceAll("_", "/")
          .padEnd(Math.ceil(encodedSignature.length / 4) * 4, "="),
      ),
      (character) => character.charCodeAt(0),
    );
    const isValid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      signature,
      new TextEncoder().encode(encodedPayload),
    );
    if (!isValid) return null;

    const parsed = JSON.parse(
      base64UrlToString(encodedPayload),
    ) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.passwordVersion !== "number" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now ||
      parsed.issuedAt > now + 60
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}
