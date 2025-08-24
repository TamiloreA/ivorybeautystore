import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Product from "@/models/product";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const form = await req.formData();
    const name = String(form.get("name") || "");
    const description = String(form.get("description") || "");
    const price = parseFloat(String(form.get("price") || "0"));
    const quantity = parseInt(String(form.get("quantity") || "0"), 10);
    const collectionId = String(form.get("collectionId") || "");
    const file = form.get("image") as unknown as File | null;

    if (!name || !price || !collectionId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const updateData: any = {
      name,
      description,
      price: parseFloat(String(price)),
      quantity: parseInt(String(quantity), 10),
      collectionRef: collectionId,
    };

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Image too large (max 5MB)" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadBufferToCloudinary(buf);
      updateData.imageUrl = uploaded.secure_url; // mirrors "req.file" path usage
    }

    const updated = await Product.findByIdAndUpdate(params.id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update product", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const product = await Product.findByIdAndDelete(params.id);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }
  // (Local file deletion in Express skipped; images are on Cloudinary here)
  return NextResponse.json({ success: true, message: "Product deleted" });
}
