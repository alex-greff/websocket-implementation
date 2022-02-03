// TODO: remove this and uninstall customize-cra and react-app-rewired
// TODO: need to take into account the app mode type
// process.env.REACT_APP_MODE === 'electron'

const path = require("path");
const {
  addWebpackAlias,
  useEslintRc,
} = require("customize-cra");

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = function override(config, env) {
  config = addWebpackAlias({
    ["@"]: resolve("src"),
  })(config);

  // https://github.com/timarney/react-app-rewired/issues/396
  // config = useEslintRc(path.resolve(__dirname, ".eslintrc.js"))(config);

  return config;
};