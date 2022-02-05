import * as dotenv from "dotenv";
import isElectron from "is-electron";

if (isElectron()) {
  // Attempt to load in the .env file (this is because when packaged
  // it is not possible to set environment variables)
  // There might be a way to bake them in using Webpack but I haven't had much
  // luck with it
  dotenv.config({ path: "./resources/app/.webpack/renderer/.env" });
}

export default {
  REFERENCE_SERVER_URL: process.env.REACT_APP_REFERENCE_SERVER_URL!,
  IMPLEMENTED_SERVER_URL: process.env.REACT_APP_IMPLEMENTED_SERVER_URL!,
};
