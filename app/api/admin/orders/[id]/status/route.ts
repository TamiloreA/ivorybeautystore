import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Order from "@/models/order";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "processing",
  "shipped",
  "delivered",
  "pending-payment",
  "cancelled",
  "failed",
]);

const ngn = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  await dbConnect();

  try {
    const { status } = (await req.json()) as { status?: string };
    if (!status || !ALLOWED.has(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const order: any = await Order.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    )
      .populate("user", "name email phone address")
      .populate("items.product", "name price");

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const formatted = {
      ...order.toObject(),
      formattedDate: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      formattedTotal: ngn(Number(order.total || 0)),
      items: order.items.map((item: any) => ({
        ...item.toObject(),
        name: item.product?.name || item.name || "Unknown Product",
      })),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update order", error: err.message },
      { status: 500 }
    );
  }
}
