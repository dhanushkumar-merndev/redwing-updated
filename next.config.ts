import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exact fix from Next.js console logs for IP access
  allowedDevOrigins: ["192.168.1.9"],
};

export default nextConfig;
