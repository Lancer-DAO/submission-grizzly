const path = require('path');
const webpack = require("webpack");

module.exports = {
  entry: './content/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },{
        test: /\.s?[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
        "@/constants": path.resolve(__dirname,"../src/constants/index.ts"),
        "@/server": path.resolve(__dirname,"../server"),
        "@/styles": path.resolve(__dirname,"../src/styles"),
        "@/types": path.resolve(__dirname,"../src/types/index.ts"),
        "@/utils": path.resolve(__dirname,"../src/utils/index.ts")
    },

    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      assert: require.resolve("assert"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify"),
      url: require.resolve("url"),
    }
  },
  output: {
    filename: 'content.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: false
},
  plugins:
    [new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    })]

};