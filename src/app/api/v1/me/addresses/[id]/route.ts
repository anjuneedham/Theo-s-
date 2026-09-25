import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { addressSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guards";
import { deleteAddress, updateAddress } from "@/lib/services/customers";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(request, addressSchema.partial().extend({ is_default: z.boolean().optional() }));
  return { address: await updateAddress(user, id, input) };
});

export const DELETE = route<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteAddress(user, id);
  return { ok: true };
});
