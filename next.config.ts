import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Dateien gehen direkt in privaten Storage; Actions übertragen nur Metadaten.
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
