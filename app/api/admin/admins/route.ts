import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_admins")
    .select("id, email, display_name, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ admins: data });
}

export async function POST(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, password, displayName } = body as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user" },
      { status: 400 }
    );
  }

  const { error: insertError } = await adminClient.from("oto_admins").insert({
    id: createdUser.user.id,
    email,
    display_name: displayName ?? null,
    created_by: authz.actingAdminId,
  });

  if (insertError) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(
      createdUser.user.id
    );
    if (rollbackError) {
      console.error(
        `Failed to roll back auth user ${createdUser.user.id} after oto_admins insert failure:`,
        rollbackError
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: createdUser.user.id, email, displayName: displayName ?? null },
    { status: 201 }
  );
}
