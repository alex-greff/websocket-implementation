const rules = require("./webpack.electron.rules");
const plugins = require("./webpack.electron.plugins");
const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const RenameWebpackPlugin = require("rename-webpack-plugin");

// console.log(process.env); // TODO: remove

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    // new webpack.DefinePlugin({
    //   // 'something.env.REACT_APP_REFERENCE_SERVER_URL': `'${process.env.REACT_APP_REFERENCE_SERVER_URL}'`,
    //   // 'something.env.REACT_APP_IMPLEMENTED_SERVER_URL': `'${process.env.REACT_APP_IMPLEMENTED_SERVER_URL}'`,
    //   "process.env.TEST": JSON.stringify("hello there"),
    // }),
    // new webpack.EnvironmentPlugin([
    //   "REACT_APP_REFERENCE_SERVER_URL",
    //   "REACT_APP_IMPLEMENTED_SERVER_URL",
    // ]),
    new CopyPlugin({
      patterns: [
        {
          from:
            process.env.ELECTRON_ENV == "dev"
              ? ".env.development"
              : ".env.production",
          to: ".",
        },
      ],
    }),
    new RenameWebpackPlugin({
      originNameReg: /\.env\..*/,
      targetName: ".env",
    }),
  ],
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  target: "node",
};
