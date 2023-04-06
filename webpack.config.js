const path = require("path");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      os: require.resolve("os-browserify/browser"),
      path: require.resolve("path-browserify"),
      fs: false,
      "url": false,
      "tls": false,
      "net": false,
      "util": false,
      "stream": false,
      "buffer": false,
      "assert": false,
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
    },
  },
};
