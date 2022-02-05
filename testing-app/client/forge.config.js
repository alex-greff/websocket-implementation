module.exports = {
  makers: [
    {
      name: "@electron-forge/maker-zip",
    },
    {
      name: "@electron-forge/maker-deb",
    },
    {
      name: "@electron-forge/maker-wix",
      // config: {
      //   language: 1033,
      //   manufacturer: 'd58-lads'
      // }
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
