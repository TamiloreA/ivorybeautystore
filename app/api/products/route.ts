import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export const runtime = "nodejs";

export async function GET() {
  await dbConnect();
  try {
    const products = await Product.find().populate("collectionRef");
    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Error getting products", error: err.message }, { status: 500 });
  }
}
