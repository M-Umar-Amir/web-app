import withBundleAnalyzer from "@next/bundle-analyzer";
import withPlugins from "next-compose-plugins";

/**
 * @type {import('next').NextConfig}
 */
const config = withPlugins([[withBundleAnalyzer({ enabled: false })]], {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
});

export default config;
