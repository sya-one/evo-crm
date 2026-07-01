import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 🔥 REQUIRED for Docker production build

  images: {
    domains: ["localhost"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;