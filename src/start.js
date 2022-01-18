import express from "express";
import { db } from "./database.js";
import "./models/index.js";

import { getRoutes } from "./routes/index.js";
import { authenticateRequest } from "./middleware/auth.middleware.js";
import fileUpload from "express-fileupload";
import { logRequest } from "./middleware/logging.middleware.js";

/**
 * Used to start the backend server
 *
 * @param {string} apiBase The base URL of the API
 * @param {number} [port=process.env.API_PORT] The port of the backend server
 */

const startApp = async (apiBase, port = process.env.API_PORT) => {
  console.log("Initialising API");
  const app = express();

  try {
    await db.authenticate();
    console.log("Database connection successful.");
  } catch (error) {
    console.log("Database connection failed.", error);
    return false;
  }

  await db.sync({ alter: true });

  app.use(express.json());
  app.use(
    fileUpload({
      createParentPath: true,
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // Automatically authenticate all requests
  app.use(apiBase, logRequest, authenticateRequest, getRoutes());

  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
  });

  return true;
};

export { startApp };
