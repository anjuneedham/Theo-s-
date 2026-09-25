import { route, parseJson } from "@/lib/api/handler";
import { partnerApplicationSchema } from "@/lib/validation";
import { getSessionUser, signUp } from "@/lib/auth/session";
import { submitPartnerApplication } from "@/lib/services/applications";
import { HttpError } from "@/lib/api/handler";
import { dispatch } from "@/lib/notifications";
import { getSettings } from "@/lib/services/catalog";

/**
 * Restaurant partner application. Signed-out applicants get an account created
 * (they need one to manage the restaurant once approved).
 */
export const POST = route(
  async (request) => {
    const input = await parseJson(request, partnerApplicationSchema);
    let user = await getSessionUser();
    if (!user) {
      if (!input.password) throw new HttpError(422, "Choose a password to create your partner account", "password_required");
      const result = await signUp({ email: input.email, password: input.password, full_name: input.contact_name, phone: input.phone });
      user = result.user;
      if (!user) {
        return { ok: true, needsEmailConfirmation: true, message: "Check your email to confirm your account, then sign in and submit again." };
      }
    }
    const created = await submitPartnerApplication(user, input);
    const settings = await getSettings();
    await dispatch({
      userId: null,
      orderId: null,
      template: "partner_application",
      title: `New partner application: ${input.restaurant_name}`,
      body: `${input.contact_name} (${input.email}, ${input.phone}) applied for ${input.restaurant_name} in ${input.city}.`,
      email: settings.support_email,
      channels: ["email"],
    }).catch(() => undefined);
    return { ok: true, ...created };
  },
  { rateLimit: { key: "apply", limit: 5, windowMs: 10 * 60_000 } },
);
