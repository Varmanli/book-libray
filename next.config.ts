import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dmi3gnfhm/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
