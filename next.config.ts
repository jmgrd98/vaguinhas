import type { NextConfig } from "next";
import * as webpack from 'webpack';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
    forceSwcTransforms: true,
  },
  compiler: {
    styledComponents: true,
  },
   webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    config.plugins.push(new webpack.EnvironmentPlugin(process.env));
    return config;
  },
};

export default nextConfig;
