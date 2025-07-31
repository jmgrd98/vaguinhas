import type { NextConfig } from "next";
import * as webpack from 'webpack';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
  },
   webpack: (config) => {
    // Load environment variables for server-side
    config.plugins.push(new webpack.EnvironmentPlugin(process.env));
    return config;
  },
};

export default nextConfig;
