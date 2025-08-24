import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import User from "@/models/user";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const customers = await User.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: customers });
  } catch {
    return NextResponse.json({ success: false, message: "Error loading customers" }, { status: 500 });
  }
}
