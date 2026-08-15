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

  /*
   * Deleting the final admin would leave the console permanently
   * unreachable: there would be no session that can pass isOtoAdmin, and
   * /dev/admins is gated behind a runtime env var the operator may no
   * longer be able to flip. Refuse rather than hand out a self-lockout.
   */
  const { count, error: countError } = await adminClient
    .from("oto_admins")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: "Cannot delete the last remaining admin" }, { status: 400 });
  }

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
