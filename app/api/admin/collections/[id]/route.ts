import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Collection from "@/models/collection";
import Product from "@/models/product";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const { name, description } = await req.json();
    const updated = await Collection.findByIdAndUpdate(params.id, { name, description }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: "Collection not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, collection: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Error updating collection" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const deleted = await Collection.findByIdAndDelete(params.id);
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Collection not found" }, { status: 404 });
  }
  await Product.deleteMany({ collectionRef: params.id });
  return NextResponse.json({ success: true, message: "Collection deleted" });
}
