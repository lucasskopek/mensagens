import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://preview-chat-b3c60e16-7adf-4fa4-99fc-01afaf63ae75.space-z.ai",
    "http://localhost:3000",
  ],
};

export default nextConfig;
