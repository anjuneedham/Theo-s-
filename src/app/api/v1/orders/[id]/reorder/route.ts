import { route } from "@/lib/api/handler";
import { reorderLines } from "@/lib/services/orders";
import { getSessionUser } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");
  return reorderLines(id, { user: await getSessionUser(), token });
});
