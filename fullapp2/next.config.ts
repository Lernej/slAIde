import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    turbopack: {
    root: path.join(__dirname, '..'), // Sets the root one level up from next.config.js
  },
};

export default nextConfig;
