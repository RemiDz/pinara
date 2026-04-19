/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@react-three/drei", "@react-three/fiber"],
  },
  webpack: (config) => {
    // Import GLSL/WGSL shader sources as raw strings.
    config.module.rules.push({
      test: /\.(glsl|wgsl|vert|frag)$/i,
      type: "asset/source",
    });
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/worklets/(.*)",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
