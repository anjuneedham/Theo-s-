import { NextResponse } from "next/server";
import { getProvider } from "@/lib/payments";
import { applyPaymentWebhook } from "@/lib/services/orders";

type Ctx = { params: Promise<{ provider: string }> };

/**
 * Payment provider webhooks. The provider adapter verifies the signature before
 * anything in the payload is trusted; unverified requests get 400.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { provider: id } = await params;
  const provider = getProvider(id);
  if (!provider?.parseWebhook || !provider.isConfigured()) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  const raw = await request.text();
  try {
    const result = await provider.parseWebhook(request, raw);
    await applyPaymentWebhook(result);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.warn(`[theos] rejected ${id} webhook:`, (err as Error).message);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
