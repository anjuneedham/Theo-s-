import type { PaymentProvider } from "./types";
import { PaymentNotConfiguredError } from "./types";

/**
 * Placeholder adapters for Caribbean acquirers. They are intentionally NOT
 * implemented against guessed endpoints: each provider issues its own API
 * specification and sandbox credentials during merchant onboarding.
 *
 * To finish one: implement createPayment (hosted payment page / redirect),
 * parseWebhook (verify the provider's signature/HMAC) and refund, then set the
 * env vars below. Until then `isConfigured()` is false and checkout hides the
 * online option, so no payment can ever be reported as successful.
 */
function unconfigured(id: string, label: string, envVars: string[]): PaymentProvider {
  return {
    id,
    label,
    methods: ["online"],
    isConfigured: () => false,
    async createPayment() {
      throw new PaymentNotConfiguredError(
        `${label} is not connected yet (requires ${envVars.join(", ")} and a completed integration).`,
      );
    },
  };
}

export const wipayProvider = unconfigured("wipay", "WiPay", ["WIPAY_ACCOUNT_NUMBER", "WIPAY_API_KEY"]);
export const powertranzProvider = unconfigured("powertranz", "PowerTranz (First Atlantic Commerce)", [
  "POWERTRANZ_ID",
  "POWERTRANZ_PASSWORD",
]);
