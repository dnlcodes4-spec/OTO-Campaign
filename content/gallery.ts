import { createClient } from "@/lib/supabase/server";
import { buildPosterUrl } from "@/lib/cloudinary";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  caption: string;
  createdAt: string;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("oto_gallery")
    .select("id, media_type, url, storage_path, caption, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    type: row.media_type as "image" | "video",
    url: row.url,
    posterUrl: row.media_type === "video" ? buildPosterUrl(row.storage_path) : undefined,
    caption: row.caption,
    createdAt: row.created_at,
  }));
}
