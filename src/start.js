import express from "express";

import { getRoutes } from "./routes/index.js";
import { authenticateRequest } from "./middleware/auth.middleware.js";
import DBWrapper from "./data/dbwrapper.js";
import models from "./models/tables/index.js";
import fileUpload from "express-fileupload";

/**
 * Used to start the backend server
 *
 * @param {string} apiBase The base URL of the API
 * @param {number} [port=process.env.API_PORT] The port of the backend server
 */
const startApp = async (apiBase, port = process.env.API_PORT) => {
  console.log("Initialising API");
  const app = express();
  const db = new DBWrapper();
  global.db = db;

  // Register all tables with the database
  // Create them if they dont exist
  let tableSuccess = db.registerTables(models);

  // Tables failed
  if (!tableSuccess) {
    console.log("Failed to create tables.");
    return;
  }

  app.use(express.json());
  app.use(
    fileUpload({
      createParentPath: true,
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // Automatically authenticate all requests
  app.use(apiBase, authenticateRequest, getRoutes());

  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
  });
};

export { startApp };
