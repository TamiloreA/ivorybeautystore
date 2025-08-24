import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Users from "@/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { email, password } = await req.json();
    const user: any = await Users.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, address: user.address, phone: user.phone },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
