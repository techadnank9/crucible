import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs resolves its worker from disk at runtime; bundling breaks that path.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
