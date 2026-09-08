import "server-only";

import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const HASH_BYTES = 64;
const HASH_PREFIX = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = (await scryptAsync(password, salt, HASH_BYTES)) as Buffer;
  return `${HASH_PREFIX}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [prefix, encodedSalt, encodedExpected] = encodedHash.split("$");
  if (prefix !== HASH_PREFIX || !encodedSalt || !encodedExpected) return false;

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const expected = Buffer.from(encodedExpected, "base64url");
    if (salt.length !== SALT_BYTES || expected.length !== HASH_BYTES) {
      return false;
    }

    const actual = (await scryptAsync(
      password,
      salt,
      expected.length,
    )) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function generateNumericPassword(): string {
  return Array.from({ length: 8 }, () => randomInt(0, 10)).join("");
}
