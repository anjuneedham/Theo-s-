import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { clientIp, rateLimit } from "../rate-limit";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

type Handler<C> = (request: Request, context: C) => Promise<Response | unknown>;

/**
 * Wraps a route handler: JSON responses, consistent error shape
 * `{ error: { message, code, fields? } }`, optional per-IP rate limiting and
 * a same-origin check for state-changing requests (CSRF defence in addition to
 * SameSite cookies).
 */
export function route<C = unknown>(fn: Handler<C>, opts: { rateLimit?: { key: string; limit: number; windowMs: number } } = {}) {
  return async (request: Request, context: C) => {
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) assertSameOrigin(request);
      if (opts.rateLimit) {
        const rl = rateLimit(`${opts.rateLimit.key}:${clientIp(request)}`, opts.rateLimit.limit, opts.rateLimit.windowMs);
        if (!rl.ok) {
          return NextResponse.json(
            { error: { message: "Too many requests. Please wait a moment and try again.", code: "rate_limited" } },
            { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
          );
        }
      }
      const result = await fn(request, context);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return; // non-browser clients (mobile apps, webhooks) don't send Origin
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host && new URL(origin).host !== host) throw new HttpError(403, "Cross-origin request blocked", "bad_origin");
}

export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json(
      { error: { message: err.issues[0]?.message ?? "Invalid input", code: "validation_error", fields } },
      { status: 422 },
    );
  }
  const e = err as { status?: number; message?: string; code?: string };
  const status = typeof e.status === "number" && e.status >= 400 && e.status < 600 ? e.status : 500;
  if (status >= 500) console.error("[theos] API error", err);
  return NextResponse.json(
    { error: { message: status >= 500 && !e.code ? "Something went wrong. Please try again." : (e.message ?? "Error"), code: e.code ?? "error" } },
    { status },
  );
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body", "bad_json");
  }
  return schema.parse(body);
}
