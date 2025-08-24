import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await dbConnect();
  const query = req.nextUrl.searchParams.get("query") || "";
  try {
    const products = await Product.find({
      $or: [{ name: new RegExp(query, "i") }, { description: new RegExp(query, "i") }],
    }).populate("collectionRef");
    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    return NextResponse.json({ message: "Error searching products", error: err.message }, { status: 500 });
  }
}
