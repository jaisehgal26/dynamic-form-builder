import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
