import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Order from "@/models/order";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await dbConnect();

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return new NextResponse(null, { status: 400 });

  const raw = await req.text(); // RAW body for signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
    .update(raw)
    .digest("hex");

  if (hash !== signature) return new NextResponse(null, { status: 401 });

  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    try {
      const p = event.data;
      await Order.findOneAndUpdate(
        { "paymentInfo.reference": p.reference },
        {
          status: "processing",
          paymentInfo: {
            method: "paystack",
            reference: p.reference,
            channel: p.channel,
            status: "paid",
            paidAt: p.paid_at,
          },
        }
      );
    } catch (err) {
      // swallow; webhook must still 200
      console.error("Webhook processing error:", err);
    }
  }

  return new NextResponse(null, { status: 200 });
}
