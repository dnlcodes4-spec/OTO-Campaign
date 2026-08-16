import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_REGISTRY } from "@/content/schemas/registry";
import { deepMergeContent } from "@/lib/content/site-content";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const entry = CONTENT_REGISTRY[key];
  if (!entry) {
    return NextResponse.json({ error: "Unknown content key" }, { status: 404 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.from("oto_site_content").select("content").eq("key", key).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: deepMergeContent(data?.content, entry.defaultValue) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (!CONTENT_REGISTRY[key]) {
    return NextResponse.json({ error: "Unknown content key" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body as { content?: unknown };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_site_content")
    .upsert({ key, content, updated_by: authz.actingAdminId })
    .select("content")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data.content });
}
