import "./src/config.js";

import { startApp } from "./src/start.js";

let startSuccess = await startApp(process.env.API_BASE_ROUTE);
if (!startSuccess) {
  console.log("Proccess failed to start.");
}
