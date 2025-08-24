import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Order from "@/models/order";

export const runtime = "nodejs";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(amount);

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email phone address")
      .populate("items.product", "name price");

    const formatted = orders.map((order: any) => {
      const o = order.toObject();
      return {
        ...o,
        formattedDate: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        formattedTotal: formatCurrency(o.total ?? 0),
        contactEmail: o.user?.email || o.shippingInfo?.email || null,
        contactPhone: o.user?.phone || o.shippingInfo?.phone || null,
        contactAddress:
          o.user?.address ||
          (o.shippingInfo
            ? `${o.shippingInfo.address}, ${o.shippingInfo.city}, ${o.shippingInfo.state}`
            : null),
        items: o.items.map((it: any) => {
          const price = it.priceAtPurchase ?? it.price ?? it.product?.price ?? 0;
          return {
            ...it,
            name: it.product?.name || it.name || "Unknown Product",
            formattedPrice: formatCurrency(price),
            formattedTotal: formatCurrency(price * (it.quantity || 0)),
          };
        }),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch {
    return NextResponse.json({ success: false, message: "Error loading orders" }, { status: 500 });
  }
}
