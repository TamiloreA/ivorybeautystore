import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Product from "@/models/product";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

// 1. FIX: Increase timeout to 60 seconds (Vercel default is 10s)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("--> GET /api/admin/products started"); // LOG
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  
  try {
    await dbConnect();
    console.log("--> DB Connected for GET"); // LOG
    const products = await Product.find().populate("collectionRef");
    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    console.error("--> GET Error:", err.message); // LOG
    return NextResponse.json({ success: false, message: "Error loading products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("--> POST /api/admin/products started"); // LOG
  
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) {
    console.log("--> Auth failed"); // LOG
    return auth;
  }

  try {
    // Step 1: DB Connection
    console.log("--> Attempting DB Connect...");
    await dbConnect();
    console.log("--> DB Connection Success");

    // Step 2: Parse Form
    console.log("--> Parsing Form Data...");
    const form = await req.formData();
    const name = String(form.get("name") || "");
    const description = String(form.get("description") || "");
    const price = parseFloat(String(form.get("price") || "0"));
    const quantity = parseInt(String(form.get("quantity") || "0"), 10);
    const collectionId = String(form.get("collectionId") || "");
    const file = form.get("image") as unknown as File | null;

    console.log("--> Form Data Parsed:", { name, price, quantity, collectionId, hasFile: !!file });

    if (!name || !price || !collectionId) {
      console.log("--> Missing fields error");
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    let imageUrl = "";
    
    // Step 3: Image Upload
    if (file) {
      console.log(`--> File detected. Size: ${file.size} bytes`);
      
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Image too large (max 5MB)" }, { status: 400 });
      }

      console.log("--> Converting file to buffer...");
      const buf = Buffer.from(await file.arrayBuffer());
      
      console.log("--> Starting Cloudinary Upload...");
      
      // CHECK: Log if env vars exist (DO NOT log the actual keys for security)
      console.log("--> Cloudinary Config Check:", { 
        hasName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasKey: !!process.env.CLOUDINARY_API_KEY, 
        hasSecret: !!process.env.CLOUDINARY_API_SECRET 
      });

      const uploaded = await uploadBufferToCloudinary(buf);
      console.log("--> Cloudinary Success. URL:", uploaded.secure_url);
      imageUrl = uploaded.secure_url;
    } else {
      console.log("--> No file provided, skipping upload.");
    }

    // Step 4: Create Product
    console.log("--> Creating Product in MongoDB...");
    const product = await Product.create({
      name,
      description,
      price,
      quantity,
      collectionRef: collectionId,
      imageUrl,
    });
    console.log("--> Product Created Successfully:", product._id);

    return NextResponse.json({ success: true, product }, { status: 201 });

  } catch (err: any) {
    // Step 5: Catch & Log the REAL error
    console.error("!!! CRITICAL POST ERROR !!!");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    
    return NextResponse.json(
      { success: false, message: "Error adding product", error: err.message },
      { status: 500 }
    );
  }
}