import type { PaymentProvider } from "./types";

/**
 * Cash or card collected by the driver/restaurant at handover. The payment stays
 * PENDING until staff mark the order delivered/collected — it is never
 * reported as paid in advance.
 */
export const offlineProvider: PaymentProvider = {
  id: "offline",
  label: "Pay on delivery / pickup",
  methods: ["cash", "card_on_delivery"],
  isConfigured: () => true,
  async createPayment() {
    return { status: "pending", provider_reference: null };
  },
  async refund(payment) {
    // Nothing was charged electronically; staff return cash in person.
    return { status: "refunded", refunded_cents: payment.amount_cents };
  },
};
