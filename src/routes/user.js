import express from "express";

import { sendError, MissingParametersError, GenericError } from "../errors/apierrors.js";
import { checkRequiredParameters } from "../utils/validations.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

import { getUserFriendRoutes } from "./user/friend.js";
import { paramUserMiddleware } from "../middleware/data.middleware.js";
import { clamp } from "../utils/funcs.js";

const getMe = async (req, res) => {
  return res.send({ user: global.db.table("user").filter(req.authenticatedUser, 10) });
};

const kakapoIDTakenCheck = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.params, ["kakapo_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { kakapo_id } = req.params;

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

const getUser = async (req, res) => {
  return res.send({ user: global.db.table("user").filter(req.user, 0) });
};

const getUserPosts = async (req, res) => {
  let { from = 0, count = 20 } = req.query;

  try {
    from = Number(from);
  } catch (castingError) {
    return sendError(res, new BadParametersError({ badParameters: ["from"] }));
  }

  try {
    count = Number(count);
  } catch (castingError) {
    return sendError(res, new BadParametersError({ badParameters: ["count"] }));
  }

  count = clamp(count, 1, 40);
  from = Math.max(from, 0); // Minimum 0

  const [queryError, queryResults] = await global.db.table("post").limit("*", { author: req.user.id }, from, count);
  if (queryError) {
    return sendError(res, new GenericError());
  }

  return res.send({
    posts: queryResults.map((post) => global.db.table("post").filter(post, 0)),
  });
};

const getUserRoutes = () => {
  const router = express.Router();

  router.get("/me", isAuthenticated, getMe);
  router.get("/idtaken/:kakapo_id", kakapoIDTakenCheck);
  router.get("/count", getUserCount);
  router.get("/:kakapo_id", paramUserMiddleware, getUser);
  router.get("/posts/:kakapo_id", paramUserMiddleware, getUserPosts);

  router.use("/friend", getUserFriendRoutes());

  return router;
};

export { getUserRoutes };
