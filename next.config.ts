import type { NextConfig } from "next";

const apiURL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.wenjin-zhilu.com"
    : "http://localhost:4002");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${apiURL}/api/auth/:path*` },
      { source: "/api/mauth/:path*", destination: `${apiURL}/api/mauth/:path*` },
      { source: "/api/call/:path*", destination: `${apiURL}/api/call/:path*` },
      { source: "/api/me/:path*", destination: `${apiURL}/api/me/:path*` },
      { source: "/api/parent-profile/:path*", destination: `${apiURL}/api/parent-profile/:path*` },
      { source: "/api/parent-profile", destination: `${apiURL}/api/parent-profile` },
      { source: "/api/mentors/:path*", destination: `${apiURL}/api/mentors/:path*` },
      { source: "/api/mentors", destination: `${apiURL}/api/mentors` },
      { source: "/api/orders/:path*", destination: `${apiURL}/api/orders/:path*` },
      { source: "/api/orders", destination: `${apiURL}/api/orders` },
      { source: "/api/admin/:path*", destination: `${apiURL}/api/admin/:path*` },
      { source: "/api/payments/:path*", destination: `${apiURL}/api/payments/:path*` },
      { source: "/api/reviews/:path*", destination: `${apiURL}/api/reviews/:path*` },
      { source: "/api/reviews", destination: `${apiURL}/api/reviews` },
    ];
  },
};

export default nextConfig;
