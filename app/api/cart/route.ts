import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Cart from "@/models/cart";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const userId = (auth as any).userId;
    const cart: any = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      model: "Product",
      select: "name price imageUrl",
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ cartItems: [], total: 0, cartCount: 0 });
    }

    const cartItems = cart.items.map((it: any) => ({
      name: it.product.name,
      price: it.product.price,
      quantity: it.quantity,
      total: it.product.price * it.quantity,
      product: it.product._id,
      imageUrl: it.product.imageUrl || "/placeholder.svg",
    }));

    const total = cartItems.reduce((acc: number, i: any) => acc + i.total, 0);
    const cartCount = cartItems.reduce((acc: number, i: any) => acc + i.quantity, 0);

    return NextResponse.json({ cartItems, total, cartCount });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
