import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config";
import { newId } from "./ids";
import { getServiceClient } from "./db/supabase";
import { HttpError } from "./api/handler";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024;

function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

/**
 * Store an uploaded image. Supabase Storage in production (public `media`
 * bucket, path restaurants/<id>/…); `public/uploads` in local development.
 * The file type is verified from its bytes, not the client-supplied header.
 */
export async function storeImage(restaurantId: string, file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new HttpError(413, "Images must be 5 MB or smaller");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !TYPES[type]) throw new HttpError(415, "Upload a JPEG, PNG or WebP image");
  const name = `${newId()}.${TYPES[type]}`;
  if (config.dataBackend === "supabase") {
    const key = `restaurants/${restaurantId}/${name}`;
    const client = getServiceClient();
    const { error } = await client.storage.from(config.supabase.storageBucket).upload(key, buf, { contentType: type, upsert: false });
    if (error) throw new HttpError(502, `Upload failed: ${error.message}`);
    return client.storage.from(config.supabase.storageBucket).getPublicUrl(key).data.publicUrl;
  }
  const dir = path.join(process.cwd(), "public", "uploads", restaurantId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return `/uploads/${restaurantId}/${name}`;
}
