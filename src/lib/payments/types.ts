import type { Order, Payment, PaymentMethod, PaymentStatus } from "../types";

export interface CreatePaymentResult {
  status: PaymentStatus;
  provider_reference: string | null;
  /** Hosted checkout page the customer must visit to pay (online payments). */
  redirect_url?: string | null;
}

export interface WebhookResult {
  /** Our payment/order this event belongs to. */
  order_id: string | null;
  provider_reference: string | null;
  status: PaymentStatus | null;
  amount_cents?: number;
}

export interface RefundResult {
  status: PaymentStatus;
  refunded_cents: number;
}

/**
 * Payment provider contract. Adding a provider (WiPay, PowerTranz/First Atlantic
 * Commerce, Lynk, NCB, Stripe…) means implementing this interface and
 * registering it in `./index.ts` — orders and checkout never change.
 */
export interface PaymentProvider {
  id: string;
  label: string;
  methods: PaymentMethod[];
  isConfigured(): boolean;
  createPayment(order: Order, ctx: { successUrl: string; cancelUrl: string }): Promise<CreatePaymentResult>;
  /** Must verify the provider's signature before trusting anything in the body. */
  parseWebhook?(request: Request, rawBody: string): Promise<WebhookResult>;
  refund?(payment: Payment, amountCents: number): Promise<RefundResult>;
}

export class PaymentNotConfiguredError extends Error {
  status = 503;
  constructor(message = "Online payments are not available yet. Please choose cash or card on delivery.") {
    super(message);
  }
}
