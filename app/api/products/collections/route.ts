import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Collection from "@/models/collection";

export const runtime = "nodejs";

export async function GET() {
  await dbConnect();
  try {
    const collections = await Collection.find().populate("bestsellers");
    return NextResponse.json({ success: true, data: collections });
  } catch (err: any) {
    return NextResponse.json({ message: "Error fetching collections", error: err.message }, { status: 500 });
  }
}
