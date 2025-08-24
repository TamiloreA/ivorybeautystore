// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⛳️ Don’t fail the build because of ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: don’t block the build on TS type errors while you iterate
    ignoreBuildErrors: true,
  },
  images: {
    // Cloudinary images, if you use next/image later
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
