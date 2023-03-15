/** @type {import('next').NextConfig} */
const withFonts = require('next-fonts');
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {

    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
      crypto: false,
      assert: false,
      process: false,
      util: false,
      encoding: false,
      stream: false,
    };
    config.module.rules = config.module.rules.map((rule) => {
      if (rule.oneOf instanceof Array) {
        rule.oneOf[rule.oneOf.length - 1].exclude = [
          /\.(js|mjs|jsx|cjs|ts|tsx)$/,
          /\.html$/,
          /\.json$/,
        ];
      }
      return rule;
    });
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          stream: require.resolve("stream-browserify"),
          zlib: require.resolve("browserify-zlib"),
        },
      },
    };
  },
};

module.exports = withFonts(nextConfig)
