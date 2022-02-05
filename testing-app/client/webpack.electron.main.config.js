const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

// console.log(process.env); // TODO: remove

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./electron/main.ts",
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.electron.rules"),
  },
  plugins: [
    // new webpack.DefinePlugin({
    //   // 'something.env.REACT_APP_REFERENCE_SERVER_URL': `'${process.env.REACT_APP_REFERENCE_SERVER_URL}'`,
    //   // 'something.env.REACT_APP_IMPLEMENTED_SERVER_URL': `'${process.env.REACT_APP_IMPLEMENTED_SERVER_URL}'`,
    //   "process.env.TEST": JSON.stringify("hello there"),
    // }),
    // new webpack.EnvironmentPlugin([
    //   "REACT_APP_REFERENCE_SERVER_URL",
    //   "REACT_APP_IMPLEMENTED_SERVER_URL",
    // ]),
    // new CopyPlugin({
    //   patterns: [
    //     { from: ".env.production", to: ".env" }
    //   ]
    // })
  ],
  resolve: {
    extensions: [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".css",
      ".json",
      ".scss",
      ".sass",
    ],
  },
  
};
