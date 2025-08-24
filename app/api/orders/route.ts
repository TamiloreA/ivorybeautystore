import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Order from "@/models/order";

export const runtime = "nodejs";

const ngn = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireUser(req);
  if (auth instanceof NextResponse) return auth;

  await dbConnect();

  try {
    const userId = (auth as any).userId;

    const order: any = await Order.findById(params.id)
      .populate("user", "_id name email")
      .populate("items.product", "name imageUrl");

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Only owner can view
    const ownerId = order.user?._id?.toString?.();
    if (!ownerId || ownerId !== userId) {
      return NextResponse.json({ success: false, message: "Unauthorized to view this order" }, { status: 403 });
    }

    const items = order.items.map((it: any) => {
      const prod = it.product || {};
      const name = it.name || prod.name || "Unknown Product";
      const price = Number(it.priceAtPurchase ?? it.price ?? 0);
      const qty = Number(it.quantity || 0);
      return {
        product: { _id: prod._id, name, imageUrl: prod.imageUrl },
        quantity: qty,
        priceAtPurchase: price,
        total: Number((price * qty).toFixed(2)),
        formattedPrice: ngn(price),
        formattedTotal: ngn(price * qty),
      };
    });

    const data = {
      _id: String(order._id),
      createdAt: order.createdAt,
      formattedDate: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: order.status,
      items,
      shippingInfo: order.shippingInfo,
      paymentInfo: order.paymentInfo,
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      shippingCost: Number(order.shippingCost || 0),
      total: Number(order.total || 0),
      formattedSubtotal: ngn(Number(order.subtotal || 0)),
      formattedTax: ngn(Number(order.tax || 0)),
      formattedShipping: ngn(Number(order.shippingCost || 0)),
      formattedTotal: ngn(Number(order.total || 0)),
    };

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error loading order details", error: err.message },
      { status: 500 }
    );
  }
}
