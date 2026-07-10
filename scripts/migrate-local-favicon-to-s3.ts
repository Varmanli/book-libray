import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSiteSettings, updateSiteSettings } from "@/lib/settings/service";
import { uploadImageToS3 } from "@/lib/server/s3";

/**
 * One-time repair for development-era favicon URLs stored as /uploads/ paths.
 * Those files are not present in production containers, so copy the current
 * local asset to durable object storage and persist its public source URL.
 */
async function main() {
  const settings = await getSiteSettings();
  const favicon = settings.faviconUrl.trim();

  if (!favicon.startsWith("/uploads/")) {
    console.log("[favicon-migration] favicon is already a durable URL; nothing to do.");
    return;
  }

  const relativePath = favicon.replace(/^\/+/, "");
  const localPath = path.join(process.cwd(), "public", relativePath);
  const buffer = await readFile(localPath);
  const filename = path.basename(localPath);
  const contentType = filename.toLowerCase().endsWith(".ico")
    ? "image/x-icon"
    : "image/png";
  const uploaded = await uploadImageToS3({
    buffer,
    contentType,
    filename,
    folder: "settings",
  });

  await updateSiteSettings({ ...settings, faviconUrl: uploaded.url });
  console.log("[favicon-migration] migrated favicon to durable object storage.");
}

void main().catch((error) => {
  console.error("[favicon-migration] failed:", error);
  process.exit(1);
});
