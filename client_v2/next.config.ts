import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {

      accounts: "./lib/stubs/empty.ts",
    },
  },
};

export default nextConfig;
