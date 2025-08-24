import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Cart from "@/models/cart";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const { productId } = await req.json();
    const userId = (auth as any).userId;

    const cart: any = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true }
    ).populate({ path: "items.product", model: "Product", select: "price" });

    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const updated: any = await Cart.findById(cart._id).populate({
      path: "items.product",
      model: "Product",
      select: "name price imageUrl",
    });

    const cartItems = updated.items.map((it: any) => ({
      name: it.product.name,
      price: it.product.price,
      quantity: it.quantity,
      total: it.product.price * it.quantity,
      product: it.product._id,
      imageUrl: it.product.imageUrl || "/placeholder.svg",
    }));
    const total = cartItems.reduce((a: number, i: any) => a + i.total, 0);
    const cartCount = cartItems.reduce((a: number, i: any) => a + i.quantity, 0);

    return NextResponse.json({ success: true, cartItems, total, cartCount });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
