import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Admin from "@/models/admin";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { email, password } = await req.json();
  const admin: any = await Admin.findOne({ email });

  if (!admin || !(await admin.comparePassword(password))) {
    return NextResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });

  return NextResponse.json({
    success: true,
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
}
