import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Local-mode password hashing (Supabase Auth handles passwords in production).
const N = 16384;
const KEYLEN = 32;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const hash = scryptSync(password, salt, KEYLEN, { N }).toString("hex");
  return `scrypt$${N}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEYLEN, { N: Number(n) });
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}
