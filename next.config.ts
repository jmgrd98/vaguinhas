import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  },
  publicRuntimeConfig: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

export default nextConfig;
