import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { error: deleteRowError } = await adminClient.from("oto_admins").delete().eq("id", id);
  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(id);
  if (deleteUserError) {
    return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
