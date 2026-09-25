import { NextResponse } from "next/server";
import { route } from "@/lib/api/handler";
import { analyticsEventSchema } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { getSessionUser } from "@/lib/auth/session";

/** First-party analytics ingestion (sendBeacon). Invalid events are dropped silently. */
export const POST = route(
  async (request) => {
    const body = await request.json().catch(() => null);
    const parsed = analyticsEventSchema.safeParse(body);
    if (!parsed.success) return new NextResponse(null, { status: 204 });
    const user = await getSessionUser().catch(() => null);
    await getDb().insert("analytics_events", {
      id: newId(),
      name: parsed.data.name,
      restaurant_id: parsed.data.restaurant_id ?? null,
      user_id: user?.id ?? null,
      session_id: parsed.data.session_id ?? null,
      path: parsed.data.path ?? null,
      properties: parsed.data.properties ?? {},
      created_at: new Date().toISOString(),
    });
    return new NextResponse(null, { status: 204 });
  },
  { rateLimit: { key: "events", limit: 240, windowMs: 60_000 } },
);
