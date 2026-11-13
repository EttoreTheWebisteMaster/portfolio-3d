import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Heavy static files: a week in the browser, then refreshed quietly. Never the /projects pages themselves, only their images.
  async headers() {
    const cached = [
      {
        key: "Cache-Control",
        value: "public, max-age=604800, stale-while-revalidate=86400",
      },
    ];
    return [
      "/models/:path*",
      "/video/:path*",
      "/projects/:file(.+\\.(?:jpg|png|webp))",
    ].map(source => ({ source, headers: cached }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
