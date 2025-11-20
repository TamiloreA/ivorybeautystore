import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Product from "@/models/product";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const products = await Product.find().populate("collectionRef");
    return NextResponse.json({ success: true, data: products });
  } catch {
    return NextResponse.json({ success: false, message: "Error loading products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    let imageUrl = "";
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Image too large (max 5MB)" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadBufferToCloudinary(buf);
      imageUrl = uploaded.secure_url;
    }

    const product = await Product.create({
      name,
      description,
      price,
      quantity,
      collectionRef: collectionId,
      imageUrl,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
       console.log(err.message)
    return NextResponse.json(
      { success: false, message: "Error adding product", error: err.message },
      { status: 500 }
    );
  }
}
