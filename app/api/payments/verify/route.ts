import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/order";
import Product from "@/models/product";
import Cart from "@/models/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.FRONTEND_URL ||
    req.nextUrl.origin;

  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
    if (!reference) {
      return NextResponse.redirect(new URL("/payment-failed", origin));
    }

    const resp = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    });
    if (!resp.ok) {
      return NextResponse.redirect(new URL("/payment-failed", origin));
    }

    const json = await resp.json();
    const payment = json?.data;
    const metadata = payment?.metadata || {};

    if (payment?.status !== "success") {
      if (metadata.orderId) await Order.findByIdAndUpdate(metadata.orderId, { status: "failed" });
      return NextResponse.redirect(new URL("/payment-failed", origin));
    }

    const order: any = await Order.findByIdAndUpdate(
      metadata.orderId,
      {
        status: "processing",
        paymentInfo: {
          method: "paystack",
          reference: payment.reference,
          channel: payment.channel,
          status: "paid",
          paidAt: payment.paid_at,
        },
      },
      { new: true }
    ).populate("items.product");

    if (order?.items?.length) {
      await Promise.all(
        order.items.map((item: any) =>
          Product.findByIdAndUpdate(item.product._id, {
            $inc: { quantity: -item.quantity, salesCount: item.quantity },
          })
        )
      );
    }

    if (metadata.cartId) await Cart.findByIdAndDelete(metadata.cartId);

    return NextResponse.redirect(new URL(`/order-success/${order?._id || ""}`, origin));
  } catch {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
    if (reference) {
      await Order.findOneAndUpdate({ "paymentInfo.reference": reference }, { status: "failed" });
    }
    return NextResponse.redirect(new URL("/payment-failed", origin));
  }
}
