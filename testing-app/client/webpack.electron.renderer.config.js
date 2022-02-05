const rules = require("./webpack.electron.rules");
const plugins = require("./webpack.electron.plugins");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const RenameWebpackPlugin = require("rename-webpack-plugin");

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
