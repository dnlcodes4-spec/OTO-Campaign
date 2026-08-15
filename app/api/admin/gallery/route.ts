import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

const GALLERY_FIELDS = "id, media_type, url, duration_seconds, caption, storage_path, created_at";

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_gallery")
    .select(GALLERY_FIELDS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, storagePath, mediaType, durationSeconds, caption } = body as {
    url?: string;
    storagePath?: string;
    mediaType?: string;
    durationSeconds?: number;
    caption?: string;
  };

  if (!url || !storagePath || (mediaType !== "image" && mediaType !== "video")) {
    return NextResponse.json(
      { error: "url, storagePath, and a valid mediaType are required" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_gallery")
    .insert({
      url,
      storage_path: storagePath,
      media_type: mediaType,
      duration_seconds: durationSeconds ?? null,
      caption: caption ?? "",
      uploaded_by: authz.actingAdminId,
    })
    .select(GALLERY_FIELDS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
