import { createHash, randomBytes, randomUUID } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

/** Deterministic UUID-shaped id derived from a key (used for seed data so SQL and local seeds match). */
export function stableId(key: string): string {
  const h = createHash("sha1").update(`theos:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const ORDER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Short, human-friendly order reference, e.g. "TH-7K2M9Q". */
export function orderNumber(prefix = "TH"): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += ORDER_ALPHABET[b % ORDER_ALPHABET.length];
  return `${prefix}-${out}`;
}

export function secureToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
