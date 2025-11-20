import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary credentials missing");
}

cloudinary.config({
  cloud_name: 'dpn8wdj2d',  
  api_key: '376324131574764',    
  api_secret: 'S4DO_quVmBhCnTE3QYFbTpq1aOQ', 
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
