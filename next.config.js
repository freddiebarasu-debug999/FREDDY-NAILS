/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    // Cap the sizes Next.js will ever generate, so phones never request
    // 2048/3840px versions of photos that are only ~1000px wide.
    deviceSizes: [360, 420, 640, 768, 1080, 1280],
    imageSizes: [56, 112, 256, 384],
    formats: ["image/webp"],
    // Keep optimised images cached for a year.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    const longCache = "public, max-age=2592000, stale-while-revalidate=86400";
    return [
      { source: "/gallery/:path*", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/hero-slide-:n.jpg", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/about-slide-:n.jpg", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/watermark-sm.png", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/freddy-nails-logo-sm.webp", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/chatbot-icon.png", headers: [{ key: "Cache-Control", value: longCache }] },
    ];
  },
};

module.exports = nextConfig;
