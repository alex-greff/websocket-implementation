module.exports = {
  makers: [
    {
      name: "@electron-forge/maker-zip",
    },
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
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
