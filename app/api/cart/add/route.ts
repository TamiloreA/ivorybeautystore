import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Cart from "@/models/cart";
import Product from "@/models/product";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const { productId, quantity } = await req.json();
    const userId = (auth as any).userId;

    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let cart: any = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [{ product: productId, quantity: parseInt(quantity) }] });
      const cartCount = 1;
      return NextResponse.json({ success: true, cartCount }, { status: 201 });
    }

    const idx = cart.items.findIndex((i: any) => i.product.toString() === productId);
    if (idx !== -1) cart.items[idx].quantity += parseInt(quantity);
    else cart.items.push({ product: productId, quantity: parseInt(quantity) });

    await cart.save();
    const cartCount = cart.items.reduce((s: number, i: any) => s + i.quantity, 0);
    return NextResponse.json({ success: true, cartCount });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
