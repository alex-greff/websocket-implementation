module.exports = {
  packagerConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "client",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        // TODO: add the deployed server's URL here too
        devContentSecurityPolicy:
          "default-src * 'unsafe-eval' 'unsafe-inline'; connect-src 'self' ws://localhost:3051/;",
        mainConfig: "./webpack.electron.main.config.js",
        renderer: {
          config: "./webpack.electron.renderer.config.js",
          entryPoints: [
            {
              html: "./electron/index.html",
              js: "./electron/renderer.ts",
              name: "main_window",
            },
          ],
        },
      },
    ],
  ],
};
