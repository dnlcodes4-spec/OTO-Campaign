import { createAdminClient } from "@/lib/supabase/admin";
import { isNextInternalSignal } from "@/lib/next-internal-errors";

export type DashboardStats = {
  admins: number;
  images: number;
  videos: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const adminClient = createAdminClient();
    const [adminsResult, imagesResult, videosResult] = await Promise.all([
      adminClient.from("oto_admins").select("id", { count: "exact", head: true }),
      adminClient
        .from("oto_gallery")
        .select("id", { count: "exact", head: true })
        .eq("media_type", "image"),
      adminClient
        .from("oto_gallery")
        .select("id", { count: "exact", head: true })
        .eq("media_type", "video"),
    ]);

    return {
      admins: adminsResult.count ?? 0,
      images: imagesResult.count ?? 0,
      videos: videosResult.count ?? 0,
    };
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    console.error("Failed to load dashboard stats:", error);
    return { admins: 0, images: 0, videos: 0 };
  }
}
