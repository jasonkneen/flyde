/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    config.module.noParse = config.module.noParse || [];
    config.module.noParse.push(require.resolve("typescript/lib/typescript.js"));

    return config;
  },
};

module.exports = nextConfig;
