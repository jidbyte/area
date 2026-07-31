import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "https://4qx0h2vh-3000.uks1.devtunnels.ms",
        "*.ngrok.io",
      ],
    },
  },
};

export default nextConfig;
