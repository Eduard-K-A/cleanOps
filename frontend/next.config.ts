import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for better performance
  reactCompiler: true,

  // Optimize package imports
  experimental: {
    optimizePackageImports: ['@stripe/react-stripe-js'],
  },

  // Prevent Node.js modules from being bundled in browser/edge runtime
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
};

export default nextConfig;
