import { readdir, unlink } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GALLERY_DIR = path.resolve(process.cwd(), "public/gallery");
const FOLDER = "oto-gallery";

export function slugify(filename) {
  const base = path.parse(filename).name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function isVideo(filename) {
  return path.extname(filename).toLowerCase() === ".mp4";
}

async function uploadFile(filePath, publicId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, public_id: publicId, resource_type: resourceType, overwrite: false },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    createReadStream(filePath).pipe(stream);
  });
}

async function main() {
  const files = await readdir(GALLERY_DIR);
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of files) {
    const filePath = path.join(GALLERY_DIR, filename);
    const video = isVideo(filename);
    const publicId = slugify(filename);
    const storagePath = `${FOLDER}/${publicId}`;

    const { data: existing, error: existingError } = await supabase
      .from("oto_gallery")
      .select("id")
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (existingError) {
      console.error(`Skipping ${filename}: failed to check for an existing row:`, existingError.message);
      failed++;
      continue;
    }

    if (existing) {
      console.log(`Skipping ${filename}: already migrated (${storagePath})`);
      skipped++;
      continue;
    }

    try {
      const result = await uploadFile(filePath, publicId, video ? "video" : "image");

      const { error: insertError } = await supabase.from("oto_gallery").insert({
        media_type: video ? "video" : "image",
        url: result.secure_url,
        duration_seconds: video ? (result.duration ?? null) : null,
        caption: "",
        storage_path: storagePath,
      });

      if (insertError) {
        console.error(`Uploaded ${filename} but failed to insert its row:`, insertError.message);
        failed++;
        continue;
      }

      if (!video) {
        await unlink(filePath);
      }

      uploaded++;
      console.log(
        `Migrated ${filename} -> ${storagePath}${video ? " (local file kept)" : " (local file deleted)"}`
      );
    } catch (error) {
      console.error(`Failed to migrate ${filename}:`, error.message);
      failed++;
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}, skipped (already migrated): ${skipped}, failed: ${failed}.`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    console.error("Migration script crashed:", error);
    process.exitCode = 1;
  });
}
