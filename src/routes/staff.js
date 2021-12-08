import express from "express";

import { getStaffUserRoutes } from "./staff/user.js";
import { getStaffPostRoutes } from "./staff/post.js";

const getStaffRoutes = () => {
  const router = express.Router();

  router.use("/user", getStaffUserRoutes());
  router.use("/post", getStaffPostRoutes());
  
  return router;
};

export { getStaffRoutes };
