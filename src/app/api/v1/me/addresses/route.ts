import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { addressSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guards";
import { createAddress, listAddresses } from "@/lib/services/customers";

export const GET = route(async () => {
  const user = await requireUser();
  return { addresses: await listAddresses(user.id) };
});

export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await parseJson(request, addressSchema.extend({ is_default: z.boolean().optional() }));
  return { address: await createAddress(user, input) };
});
