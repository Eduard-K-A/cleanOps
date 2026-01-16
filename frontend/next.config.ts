import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for better performance
  reactCompiler: true,

  // Optimize package imports
  experimental: {
    optimizePackageImports: ['@stripe/react-stripe-js'],
  },

  // Keep webpack for now to avoid migration issues
  // Remove or comment out this if you want to enable Turbopack in the future
  // For Turbopack migration, webpack config should be converted to turbopack config
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Node.js modules from being loaded on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        zlib: false,
        buffer: false,
        util: false,
        net: false,
        tls: false,
        events: false,
      };
    }

    // Ensure proper module resolution
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };

    return config;
  },

  // Add empty turbopack config to suppress Turbopack warnings when webpack is active
  // This acknowledges the presence of webpack config
  turbopack: {},
};

export default nextConfig;
