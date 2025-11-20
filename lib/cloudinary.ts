import { v2 as cloudinary } from "cloudinary";

// 1. CRITICAL FIX: Remove the "Ghost" variable that overrides your config
if (process.env.CLOUDINARY_URL) {
  console.log("Found CLOUDINARY_URL, deleting it to force manual config...");
  delete process.env.CLOUDINARY_URL;
}

// 2. Use your hardcoded test values (or env vars)
cloudinary.config({
  cloud_name: 'dpn8wdj2d',             // Your REAL Cloud Name
  api_key: '376324131574764',          // Your REAL API Key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Keep this as env for security
  secure: true,
});

export function uploadBufferToCloudinary(
  buffer: Buffer,
  { folder = "ivory-beauty/products", public_id = `product-${Date.now()}` } = {}
) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        format: "webp",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
        public_id,
      },
      (err, result) => (err || !result ? reject(err) : resolve(result as any))
    );
    stream.end(buffer);
  });
}