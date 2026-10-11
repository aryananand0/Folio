import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "covers.openlibrary.org", pathname: "/b/id/**", search: "?default=false" }],
  },
};

export default nextConfig;
