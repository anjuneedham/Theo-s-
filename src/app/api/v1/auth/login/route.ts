import { route, parseJson } from "@/lib/api/handler";
import { loginSchema } from "@/lib/validation";
import { signIn } from "@/lib/auth/session";

export const POST = route(
  async (request) => {
    const input = await parseJson(request, loginSchema);
    const user = await signIn(input.email, input.password);
    return { user };
  },
  { rateLimit: { key: "login", limit: 10, windowMs: 5 * 60_000 } },
);
