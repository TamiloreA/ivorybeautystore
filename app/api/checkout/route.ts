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
    const cart: any = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
    }

    const subtotal = cart.items.reduce((sum: number, it: any) => sum + it.product.price * it.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        cartItems: cart.items.map((it: any) => ({
          product: { _id: it.product._id, name: it.product.name, price: it.product.price, imageUrl: it.product.imageUrl },
          quantity: it.quantity,
          total: it.product.price * it.quantity,
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingOptions: [
          { method: "standard", cost: 0, label: "Standard Shipping" },
          { method: "express", cost: 9.99, label: "Express Shipping" },
          { method: "overnight", cost: 24.99, label: "Overnight Shipping" },
        ],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error loading checkout details", error: err.message },
      { status: 500 }
    );
  }
}
