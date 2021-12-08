import express from "express";
import { getAuthRoutes } from "./auth.js";
import { getUserRoutes } from "./user.js";
import { getStaffRoutes } from "./staff.js";
import { getPostRoutes } from "./post.js";

import { isRank } from "../middleware/auth.js";

const getRoutes = () => {
  const router = express.Router();

  router.use("/auth", getAuthRoutes());
  router.use("/user", getUserRoutes());
  router.use("/post", getPostRoutes());

  // All staff routes require rank 50
  router.use("/staff", isRank(50), getStaffRoutes());

  return router;
};

export { getRoutes };
