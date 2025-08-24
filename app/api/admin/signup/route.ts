import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Admin from "@/models/admin";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, email, password, adminCode } = await req.json();
  const ADMIN_CODE = process.env.ADMIN_CODE || "IVORYSECRET2025";

  if (adminCode !== ADMIN_CODE) {
    return NextResponse.json(
      { success: false, message: "Invalid Admin Code" },
      { status: 403 }
    );
  }

  try {
    const admin: any = await Admin.create({ name, email, password, adminCode });
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });
    return NextResponse.json(
      {
        success: true,
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Signup error: " + err.message },
      { status: 400 }
    );
  }
}
