// app/api/users/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractToken(req: NextRequest): string | null {
    const auth = req.headers.get("authorization") || "";
    const [scheme, token] = auth.split(" ");
    return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    await dbConnect();

    const u = await User.findById(decoded.userId).select("name email address phone");
    if (!u) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          address: u.address,
          phone: u.phone,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Auth failed" },
      { status: 401 }
    );
  }
}
