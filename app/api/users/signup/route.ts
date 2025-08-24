import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Users from "@/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { name, email, address, phone, password, confirmPassword } = await req.json();

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Passwords do not match" }, { status: 400 });
    }

    const existing = await Users.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user: any = await Users.create({ name, email, address, phone, password: hashed });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        token,
        user: { id: user._id, name: user.name, email: user.email, address: user.address, phone: user.phone },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
