import { createClient } from "@/lib/supabase/server";
import { buildPosterUrl } from "@/lib/cloudinary";
import { isNextInternalSignal } from "@/lib/next-internal-errors";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  caption: string;
  createdAt: string;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("oto_gallery")
      .select("id, media_type, url, storage_path, caption, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Failed to load oto_gallery:", error);
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
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    // A malformed Supabase client (e.g. a missing env var) throws during
    // construction rather than returning a query error. Catching it here
    // keeps the gallery page rendering an empty grid instead of crashing
    // the whole Server Component render, and still surfaces the real cause
    // in server logs instead of the client-visible "digest" placeholder.
    console.error("Failed to load oto_gallery:", error);
    return [];
  }
}
