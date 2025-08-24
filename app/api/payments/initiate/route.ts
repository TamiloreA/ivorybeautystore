import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUser } from "@/lib/auth";
import User from "@/models/user";
import Cart from "@/models/cart";
import Order from "@/models/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof NextResponse) return auth;

  await dbConnect();

  try {
    const userId = (auth as any).userId;
    const body = await req.json();

    const user: any = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cart: any = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    // Verify stock + totals
    for (const item of cart.items) {
      if (item.product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${item.product.name} (Available: ${item.product.quantity})` },
          { status: 400 }
        );
      }
    }

    const subtotal = cart.items.reduce((sum: number, it: any) => sum + it.product.price * it.quantity, 0);
    const shippingCost = body.shippingCost || 0;
    const tax = body.tax || 0;
    const total = subtotal + tax + shippingCost;

    const order: any = await Order.create({
      user: userId,
      items: cart.items.map((it: any) => ({
        product: it.product._id,
        name: it.product.name,
        quantity: it.quantity,
        priceAtPurchase: it.product.price,
      })),
      shippingInfo: body.shippingInfo,
      paymentInfo: { method: "paystack", status: "pending" },
      subtotal,
      tax,
      shippingCost,
      total,
      status: "pending-payment",
    });

    // Build an origin that works locally and on Vercel
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.FRONTEND_URL ||
      req.nextUrl.origin;

    // ✅ Correct path + leading slash
    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(total * 100),
        currency: "NGN",
        callback_url: `${origin}/api/payments/verify`,
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
          cartId: cart._id.toString(),
        },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json(
        { success: false, error: "Payment initialization failed", details: txt },
        { status: 500 }
      );
    }

    const data = await resp.json();
    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Payment initialization failed", details: err.message },
      { status: 500 }
    );
  }
}
