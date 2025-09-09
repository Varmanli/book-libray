import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.iranketab.ir",
        pathname: "/Images/ProductImages/**",
      },
    ],
  },
};

export default nextConfig;
