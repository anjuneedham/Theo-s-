import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider, WebhookResult } from "./types";
import type { PaymentStatus } from "../types";

/**
 * Reference hosted-checkout integration using Stripe Checkout's REST API.
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET. Note: Stripe does not
 * currently onboard Jamaica-registered merchants directly; a Caribbean acquirer
 * (e.g. WiPay, PowerTranz/FAC) can be added by implementing the same interface.
 */
const API = "https://api.stripe.com/v1";

function key() {
  return process.env.STRIPE_SECRET_KEY ?? "";
}

// Stripe expects amounts in the currency's smallest unit; JMD is a two-decimal currency.
export const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Card (online)",
  methods: ["online"],
  isConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  async createPayment(order, ctx) {
    const body = new URLSearchParams({
      mode: "payment",
      success_url: ctx.successUrl,
      cancel_url: ctx.cancelUrl,
      client_reference_id: order.id,
      "metadata[order_id]": order.id,
      "payment_intent_data[metadata][order_id]": order.id,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": order.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(order.total_cents),
      "line_items[0][price_data][product_data][name]": `Order ${order.order_number}`,
    });
    if (order.contact_email) body.set("customer_email", order.contact_email);
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `order-${order.id}` },
      body,
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!res.ok || !json.id) throw new Error(`Stripe: ${json.error?.message ?? res.statusText}`);
    return { status: "requires_action", provider_reference: json.id, redirect_url: json.url ?? null };
  },
  async parseWebhook(request, rawBody): Promise<WebhookResult> {
    const header = request.headers.get("stripe-signature") ?? "";
    const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) throw new Error("Missing Stripe signature");
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new Error("Stale Stripe webhook");
    const expected = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET ?? "").update(`${timestamp}.${rawBody}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid Stripe signature");

    const event = JSON.parse(rawBody) as {
      type: string;
      data: { object: { id: string; metadata?: { order_id?: string }; amount_total?: number; payment_status?: string } };
    };
    const obj = event.data.object;
    let status: PaymentStatus | null = null;
    if (event.type === "checkout.session.completed" && obj.payment_status === "paid") status = "paid";
    if (event.type === "checkout.session.async_payment_succeeded") status = "paid";
    if (event.type === "checkout.session.async_payment_failed") status = "failed";
    if (event.type === "checkout.session.expired") status = "cancelled";
    return { order_id: obj.metadata?.order_id ?? null, provider_reference: obj.id, status, amount_cents: obj.amount_total };
  },
  async refund(payment, amountCents) {
    // Look up the PaymentIntent from the Checkout Session, then refund it.
    const session = await fetch(`${API}/checkout/sessions/${payment.provider_reference}`, {
      headers: { Authorization: `Bearer ${key()}` },
    }).then((r) => r.json() as Promise<{ payment_intent?: string }>);
    if (!session.payment_intent) throw new Error("Stripe: payment intent not found for refund");
    const res = await fetch(`${API}/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ payment_intent: session.payment_intent, amount: String(amountCents) }),
    });
    const json = (await res.json()) as { status?: string; error?: { message: string } };
    if (!res.ok) throw new Error(`Stripe refund: ${json.error?.message ?? res.statusText}`);
    const refunded = payment.refunded_cents + amountCents;
    return { status: refunded >= payment.amount_cents ? "refunded" : "partially_refunded", refunded_cents: refunded };
  },
};
