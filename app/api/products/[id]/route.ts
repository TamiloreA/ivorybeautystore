import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const product = await Product.findById(params.id).populate("collectionRef");
    if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json({ message: "Error getting product", error: err.message }, { status: 500 });
  }
}
