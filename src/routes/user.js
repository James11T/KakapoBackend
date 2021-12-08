import express from "express";

import { sendError, MissingParametersError, GenericError } from "../errors/apierrors.js";
import { checkRequiredParameters } from "../utils/validations.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { getUserAtSensitivity } from "./shared.js";

import { getUserFriendRoutes } from "./user/friend.js";

const getMe = async (req, res) => {
  return res.send({ user: global.db.table("user").filter(req.authenticatedUser, 10) });
};

const kakapoIDTakenCheck = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["kakapo_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const kakapo_id = req.body.kakapo_id;

  const [getUserError, user] = await global.db.table("user").first(["kakapo_id"], { kakapo_id: kakapo_id });
  if (getUserError) {
    return sendError(res, new GenericError());
  }

  return res.send({ taken: !!user });
};

const getUserCount = async (req, res) => {
  const [countError, userCount] = await global.db.table("user").count();
  if (countError) {
    return sendError(res, countError);
  }

  return res.send({ count: userCount });
};

const getUserRoutes = () => {
  const router = express.Router();

  router.get("/", getUserAtSensitivity(0));
  router.get("/me", isAuthenticated, getMe);
  router.get("/idtaken", kakapoIDTakenCheck);
  router.get("/count", getUserCount);

  router.use("/friend", getUserFriendRoutes());

  return router;
};

export { getUserRoutes };
