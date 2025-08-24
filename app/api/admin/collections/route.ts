import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Collection from "@/models/collection";
import Product from "@/models/product";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const collections = await Collection.find();
    const counts: Record<string, number> = {};
    for (const c of collections) {
      counts[c._id.toString()] = await Product.countDocuments({ collectionRef: c._id });
    }
    return NextResponse.json({
      success: true,
      data: collections.map((c: any) => ({
        ...c.toObject(),
        productCount: counts[c._id.toString()] || 0,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Error loading collections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const { name, description } = await req.json();
    const collection = await Collection.create({ name, description });
    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Error creating collection" }, { status: 500 });
  }
}
