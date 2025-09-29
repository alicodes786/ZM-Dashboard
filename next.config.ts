import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Intl polyfills are available
  experimental: {
    esmExternals: false,
  },
  // Add webpack config to handle polyfills if needed
  webpack: (config: any) => {
    // Add any necessary polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };
    return config;
  },
};

export default nextConfig;
