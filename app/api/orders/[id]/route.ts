// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import Order from "@/models/order";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Accept EITHER a user token or an admin token
  const userAuth = requireUser(req);
  const adminAuth = requireAdmin(req);

  const isUser = !(userAuth instanceof NextResponse);
  const isAdmin = !(adminAuth instanceof NextResponse);

  if (!isUser && !isAdmin) {
    // return the user 401 (either is fine)
    return userAuth as NextResponse;
  }

  await dbConnect();

  try {
    const order: any = await Order.findById(params.id)
      .populate("user", "name email")
      .populate("items.product", "name imageUrl");

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // If this is a USER request, ensure it’s their order (only if order has a user)
    if (isUser) {
      const userId = (userAuth as any).userId;
      if (order.user && order.user._id.toString() !== userId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized to view this order" },
          { status: 403 }
        );
      }
      // If the order has no user (guest), block viewing for normal users
      if (!order.user) {
        return NextResponse.json(
          { success: false, message: "Guest order – sign in not linked" },
          { status: 403 }
        );
      }
    }

    // build payload safely
    const data = {
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      items: (order.items || []).map((it: any) => ({
        product: it.product
          ? { _id: it.product._id, name: it.product.name, imageUrl: it.product.imageUrl }
          : { _id: null, name: it.name || "Unknown Product", imageUrl: undefined },
        quantity: it.quantity,
        priceAtPurchase: it.priceAtPurchase,
        total: it.priceAtPurchase * it.quantity,
      })),
      shippingInfo: order.shippingInfo,
      paymentInfo: order.paymentInfo,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      total: order.total,
    };

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error loading order details", error: err.message },
      { status: 500 }
    );
  }
}
