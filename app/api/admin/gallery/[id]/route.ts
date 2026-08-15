import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";
import { cloudinary } from "@/lib/cloudinary";

const GALLERY_FIELDS = "id, media_type, url, duration_seconds, caption, storage_path, created_at";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { caption } = body as { caption?: string };

  if (typeof caption !== "string") {
    return NextResponse.json({ error: "caption is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_gallery")
    .update({ caption })
    .eq("id", id)
    .select(GALLERY_FIELDS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: deletedRows, error: deleteRowError } = await adminClient
    .from("oto_gallery")
    .delete()
    .eq("id", id)
    .select("storage_path, media_type");

  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  if (!deletedRows || deletedRows.length === 0) {
    return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
  }

  const [deletedItem] = deletedRows;
  const resourceType = deletedItem.media_type === "video" ? "video" : "image";

  try {
    await cloudinary.uploader.destroy(deletedItem.storage_path, { resource_type: resourceType });
  } catch (cloudinaryError) {
    console.error(`Failed to delete Cloudinary asset ${deletedItem.storage_path}:`, cloudinaryError);
  }

  return NextResponse.json({ ok: true });
}
