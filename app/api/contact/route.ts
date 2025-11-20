import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();
    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: { received: { name, email, subject, message } } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}