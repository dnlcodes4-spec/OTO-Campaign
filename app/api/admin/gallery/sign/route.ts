import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { signUpload } from "@/lib/cloudinary";

const ALLOWED_FOLDERS = ["oto-gallery", "oto-site"];

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") ?? "oto-gallery";

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: "Unknown upload folder" }, { status: 400 });
  }

  return NextResponse.json(signUpload(folder));
}
