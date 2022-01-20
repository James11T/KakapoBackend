import express from "express";

import {
  sendError,
  MissingParametersError,
  GenericError,
} from "../errors/apierrors.js";
import { checkRequiredParameters } from "../utils/validations.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

import { getUserFriendRoutes } from "./user/friend.js";
import { paramUserMiddleware } from "../middleware/data.middleware.js";
import { clamp } from "../utils/funcs.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";

const getMe = async (req, res) => {
  // ADD FILTER
  return res.send({ user: req.authenticatedUser });
};

const kakapoIDTakenCheck = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(
    req.params,
    ["kakapo_id"]
  );
  if (!hasRequiredParameters) {
    return sendError(
      res,
      new MissingParametersError({ missingParameters: missingParameters })
    );
  }

  const { kakapo_id } = req.params;

  try {
    const userCount = await User.count({
      where: { kakapo_id: kakapo_id },
    });
    return res.send({ taken: userCount > 0 });
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve user"));
  }
};

const getUserCount = async (req, res) => {
  try {
    const count = await User.count();
    return res.send({ count: count });
  } catch (error) {
    return sendError(res, new GenericError("Failed to count users."));
  }
};

const getUser = async (req, res) => {
  // ADD FILTER
  return res.send({ user: req.user });
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

  try {
    const results = await Post.findAll({
      limit: count,
      offset: from,
      where: { author_id: req.user.id },
      include: [{ model: User, as: "author", foreignKey: "author_id" }],
    });
    return res.send({
      // ADD FILTER
      posts: results,
    });
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve posts."));
  }
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
