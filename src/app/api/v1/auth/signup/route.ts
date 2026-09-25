import { route, parseJson } from "@/lib/api/handler";
import { signupSchema } from "@/lib/validation";
import { signUp } from "@/lib/auth/session";

export const POST = route(
  async (request) => {
    const input = await parseJson(request, signupSchema);
    return signUp(input);
  },
  { rateLimit: { key: "signup", limit: 5, windowMs: 10 * 60_000 } },
);
