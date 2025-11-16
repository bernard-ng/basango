/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
        source: "/((?!api/proxy).*)",
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@basango/ui", "@basango/api", "@basango/domain"],
};

export default nextConfig;
