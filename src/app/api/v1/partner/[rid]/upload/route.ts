import { partnerRoute } from "@/lib/api/partner";
import { HttpError } from "@/lib/api/handler";
import { storeImage } from "@/lib/storage";

/** Upload a logo, cover or menu photo (JPEG/PNG/WebP, max 5 MB). */
export const POST = partnerRoute(async ({ request, rid }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file uploaded");
  return { url: await storeImage(rid, file) };
});
