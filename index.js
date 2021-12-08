import dotenv from "dotenv";
import { startApp } from "./src/start.js";

dotenv.config();

await startApp(process.env.API_BASE_ROUTE);
