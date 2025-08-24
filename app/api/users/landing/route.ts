import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { optionalAuth } from "@/lib/auth";
import Product from "@/models/product";
import Cart from "@/models/cart";
import Collection from "@/models/collection";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const payload = optionalAuth(req);

    const products = await Product.find().populate("collectionRef", "name").lean();

    let cartCount = 0;
    if (payload?.userId) {
      const cart: any = await Cart.findOne({ user: payload.userId });
      cartCount = cart ? cart.items.reduce((sum: number, it: any) => sum + it.quantity, 0) : 0;
    }

    const collections = await Collection.find().lean();
    const collectionsWithProducts = await Promise.all(
      collections.map(async (c: any) => {
        const prods = await Product.find({ collectionRef: c._id }).populate("collectionRef", "name").lean();
        return { ...c, products: prods || [] };
      })
    );

    return NextResponse.json({
      success: true,
      data: { products, collections: collectionsWithProducts, cartCount },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to load landing page data", error: err.message },
      { status: 500 }
    );
  }
}
