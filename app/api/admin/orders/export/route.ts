import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Order from "@/models/order";

export const runtime = "nodejs";

function csvEscape(val: any) {
  const s = String(val ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  await dbConnect();

  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate("items.product", "name");

    const header = [
      "Order ID",
      "Date",
      "Customer",
      "Email",
      "Phone",
      "Status",
      "Total",
      "Items",
    ];

    const rows = [header.join(",")];

    for (const o of orders) {
      const date = new Date(o.createdAt).toISOString().split("T")[0];
      const items = (o.items || [])
        .map(
          (it: any) => `${it.product?.name || it.name || "Unknown"} x ${it.quantity}`
        )
        .join(" | ");

      rows.push(
        [
          o._id,
          date,
          o.user?.name || "Guest",
          o.user?.email || o.shippingInfo?.email || "",
          o.user?.phone || o.shippingInfo?.phone || "",
          o.status,
          Number(o.total || 0).toFixed(2),
          items,
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    const csv = rows.join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="orders_export.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to export orders", error: err.message },
      { status: 500 }
    );
  }
}
