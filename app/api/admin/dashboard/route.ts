import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Collection from "@/models/collection";
import Product from "@/models/product";
import Order from "@/models/order";
import User from "@/models/user";

export const runtime = "nodejs";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(amount);

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await dbConnect();

  try {
    const [collections, products, totalProducts, totalCollections, totalOrders, totalCustomers, orders] =
      await Promise.all([
        Collection.find(),
        Product.find().populate("collectionRef"),
        Product.countDocuments(),
        Collection.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        // ✅ populate user + line items
        Order.find().sort({ createdAt: -1 }).limit(5)
          .populate("user", "name email phone address")
          .populate("items.product", "name price"),
      ]);

    // (optional) if you care about speed, swap for a single aggregation; keeping your pattern:
    const collectionCounts: Record<string, number> = {};
    for (const c of collections) {
      collectionCounts[c._id.toString()] = await Product.countDocuments({ collectionRef: c._id });
    }

    const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    const recentOrders = orders.map((order: any) => {
      const o = order.toObject();
      return {
        ...o,
        formattedDate: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        formattedTotal: formatCurrency(o.total ?? 0),
        // ✅ provide contact/name even for guests
        contactEmail: o.user?.email || o.shippingInfo?.email || null,
        contactPhone: o.user?.phone || o.shippingInfo?.phone || null,
        contactAddress:
          o.user?.address ||
          (o.shippingInfo
            ? `${o.shippingInfo.address}, ${o.shippingInfo.city}, ${o.shippingInfo.state}`
            : null),
        // ✅ ensure item name/price exist even without populate
        items: o.items.map((it: any) => {
          const price =
            it.priceAtPurchase ?? it.price ?? it.product?.price ?? 0;
          return {
            ...it,
            name: it.product?.name || it.name || "Unknown Product",
            formattedPrice: formatCurrency(price),
            formattedTotal: formatCurrency(price * (it.quantity || 0)),
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        collections,
        products: products.slice(0, 5),
        collectionCounts,
        stats: {
          totalProducts,
          totalCollections,
          totalOrders,
          totalCustomers,
          totalSales: formatCurrency(totalSales),
        },
        recentOrders,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Dashboard error" }, { status: 500 });
  }
}
