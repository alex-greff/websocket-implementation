const path = require("path");
const CracoAlias = require("craco-alias");

module.exports = {
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from tsconfig
        baseUrl: "./src",
        /* tsConfigPath should point to the file where "baseUrl" and "paths" 
          are specified*/
        tsConfigPath: "./base-tsconfig.json",
      },
    },
  ],
  // This also works as an alternate
  // webpack: {
  //   alias: {
  //     '@': path.resolve(__dirname, 'src'),
  //   },
  // },
};
