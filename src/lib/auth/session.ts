import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { config } from "../config";
import { getDb } from "../db";
import type { Profile, UserRole } from "../types";
import { hashPassword, verifyPassword } from "./password";
import { newId } from "../ids";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
}

const COOKIE = "theos_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  if (config.sessionSecret) return config.sessionSecret;
  if (config.isProduction && config.dataBackend === "local") {
    throw new Error("SESSION_SECRET must be set in production when DATA_BACKEND=local");
  }
  return "theos-dev-only-session-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof uid !== "string" || typeof exp !== "number" || exp < Date.now() / 1000) return null;
    return uid;
  } catch {
    return null;
  }
}

/** Supabase SSR client bound to the request cookies (anon key; used for Auth only). */
export async function supabaseAuthClient() {
  const store = await cookies();
  return createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component — cookies can't be set there; the proxy refreshes them.
        }
      },
    },
  });
}

function toSessionUser(p: Profile): SessionUser {
  return { id: p.id, email: p.email, full_name: p.full_name, phone: p.phone, role: p.role };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const db = getDb();
  if (config.dataBackend === "supabase") {
    const supabase = await supabaseAuthClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const profile = await db.get("profiles", data.user.id);
    return profile ? toSessionUser(profile) : null;
  }
  const store = await cookies();
  const uid = decodeSession(store.get(COOKIE)?.value);
  if (!uid) return null;
  const profile = await db.get("profiles", uid);
  return profile ? toSessionUser(profile) : null;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

async function setLocalSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  if (config.dataBackend === "supabase") {
    const supabase = await supabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error || !data.user) throw new AuthError("Incorrect email or password", 401);
    const profile = await db.get("profiles", data.user.id);
    if (!profile) throw new AuthError("Account profile not found", 404);
    return toSessionUser(profile);
  }
  const cred = await db.findOne("local_credentials", { email: normalized });
  if (!cred || !verifyPassword(password, cred.password_hash)) throw new AuthError("Incorrect email or password", 401);
  const profile = await db.get("profiles", cred.id);
  if (!profile) throw new AuthError("Account profile not found", 404);
  await setLocalSession(profile.id);
  return toSessionUser(profile);
}

export async function signUp(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  marketing_opt_in?: boolean;
}): Promise<{ user: SessionUser | null; needsEmailConfirmation: boolean }> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  if (config.dataBackend === "supabase") {
    const supabase = await supabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { full_name: input.full_name, phone: input.phone ?? null },
        emailRedirectTo: `${config.siteUrl}/account`,
      },
    });
    if (error || !data.user) throw new AuthError(error?.message ?? "Could not create account");
    // The `handle_new_user` trigger creates the profile; make sure it exists.
    let profile = await db.get("profiles", data.user.id);
    if (!profile) {
      profile = await db.insert("profiles", {
        id: data.user.id,
        email,
        full_name: input.full_name,
        phone: input.phone ?? null,
        role: "customer",
        marketing_opt_in: Boolean(input.marketing_opt_in),
        created_at: new Date().toISOString(),
      });
    }
    return { user: data.session ? toSessionUser(profile) : null, needsEmailConfirmation: !data.session };
  }
  if (await db.findOne("local_credentials", { email })) throw new AuthError("An account with this email already exists", 409);
  const id = newId();
  const profile = await db.insert("profiles", {
    id,
    email,
    full_name: input.full_name,
    phone: input.phone ?? null,
    role: "customer",
    marketing_opt_in: Boolean(input.marketing_opt_in),
    created_at: new Date().toISOString(),
  });
  await db.insert("local_credentials", { id, email, password_hash: hashPassword(input.password) });
  await setLocalSession(id);
  return { user: toSessionUser(profile), needsEmailConfirmation: false };
}

export async function signOut() {
  if (config.dataBackend === "supabase") {
    const supabase = await supabaseAuthClient();
    await supabase.auth.signOut();
    return;
  }
  const store = await cookies();
  store.delete(COOKIE);
}
