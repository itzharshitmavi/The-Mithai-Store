import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireRole } from "@/lib/auth";
import { handle, fail } from "@/lib/api";
// Writes to /public/uploads (fine on a VPS/Docker with a persistent disk).
// On serverless hosts (Vercel) replace with S3/R2/Cloudinary, or paste image URLs instead.
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const POST = (req: Request) => handle(async () => {
  await requireRole("ADMIN", "STAFF");
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw fail("No file");
  if (!EXT[file.type]) throw fail("Only PNG, JPG or WebP images");
  if (file.size > 2 * 1024 * 1024) throw fail("Image must be under 2 MB");
  const name = `${crypto.randomUUID()}.${EXT[file.type]}`;
  await writeFile(path.join(process.cwd(), "public", "uploads", name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}` };
});
