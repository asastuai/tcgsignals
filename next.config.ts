import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pokemontcg.io" },
      { protocol: "https", hostname: "www.optcgapi.com" },
      { protocol: "https", hostname: "en.onepiece-cardgame.com" },
    ],
  },
};

export default nextConfig;
