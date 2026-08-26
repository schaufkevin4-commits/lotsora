import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Datei-Uploads (Tag 23): Standard-Limit ist 1 MB. Wir erlauben bis ~10 MB
      // Datei plus etwas Multipart-Overhead (Boundaries/Header).
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;