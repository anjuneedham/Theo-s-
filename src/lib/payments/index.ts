import type { PaymentMethod } from "../types";
import { offlineProvider } from "./offline";
import { stripeProvider } from "./stripe";
import { powertranzProvider, wipayProvider } from "./caribbean";
import { PaymentNotConfiguredError, type PaymentProvider } from "./types";

const providers: Record<string, PaymentProvider> = {
  offline: offlineProvider,
  stripe: stripeProvider,
  wipay: wipayProvider,
  powertranz: powertranzProvider,
};

/** Which provider handles online card payments. Set PAYMENTS_ONLINE_PROVIDER. */
export function onlineProvider(): PaymentProvider | null {
  const id = process.env.PAYMENTS_ONLINE_PROVIDER ?? "stripe";
  const p = providers[id];
  return p && p.isConfigured() ? p : null;
}

export function providerFor(method: PaymentMethod): PaymentProvider {
  if (method === "online") {
    const p = onlineProvider();
    if (!p) throw new PaymentNotConfiguredError();
    return p;
  }
  return offlineProvider;
}

export function getProvider(id: string): PaymentProvider | null {
  return providers[id] ?? null;
}

/** Payment methods that can actually be used right now (settings ∩ configured providers). */
export function availablePaymentMethods(enabled: PaymentMethod[]): PaymentMethod[] {
  return enabled.filter((m) => m !== "online" || onlineProvider() !== null);
}

export * from "./types";
