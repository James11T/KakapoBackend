import express from "express";

import { getUserAtSensitivity } from "../shared.js";
import { clamp } from "../../utils/funcs.js";
import { isRank } from "../../middleware/auth.middleware.js";
import { BadParametersError, GenericError } from "../../errors/apierrors.js";
import { resolveUserMiddleware } from "../../middleware/data.middleware.js";
import { checkDisplayName } from "../../utils/validations.js";

/**
 * Get a user from the database with added info like post, comment and friend count
 */
const getFullUserData = async (req, res) => {
  const [postCountErr, postCount] = await global.db.table("post").count({ author: req.user.id });
  const [friendCountErr, friendCount] = await global.db
    .table("friendship")
    .count({ user1: req.user.id, user2: req.user.id }, "OR");
  const [commentCountErr, commentCount] = await global.db.table("comment").count({ author: req.user.id });

  if (postCountErr || friendCountErr || commentCountErr) {
    return sendError(res, new GenericError());
  }

  return res.send({
    user: {
      ...global.db.table("user").filter(req.user, 50),
      post_count: postCount,
      friend_count: friendCount,
      comment_count: commentCount,
    },
  });
};

const getUsers = async (req, res) => {
  /**
   * Get 'count' user entries after the 'from'th entry
   */

  let { from = 0, count = 20 } = req.body;

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

  count = clamp(count, 1, 50);
  from = Math.max(from, 0); // Minimum 0

  const [queryError, queryResults] = await global.db.table("user").limit("*", {}, from, count);
  if (queryError) {
    return sendError(res, new GenericError());
  }

  return res.send({
    users: queryResults.map((user) => global.db.table("user").filter(user, 50)),
  });
};

const getAllUsers = async (req, res) => {
  /**
   * Get all user entries
   */

  const [queryError, queryResults] = await global.db.table("user").all();
  if (queryError) {
    return sendError(res, new GenericError());
  }

  return res.send({
    users: queryResults.map((user) => global.db.table("user").filter(user, 50)),
  });
};

// Rules that define the manual setting of a users data
const dataRules = {
  display_name: {
    rank: 50,
    type: "string",
    check: checkDisplayName,
  },
  kakapo_id: {
    rank: 70,
    type: "string",
    check: (kakapoId) => !kakapoIdTaken(kakapoId),
  },
};

const setUserDataRaw = async (req, res) => {};

const getStaffUserRoutes = () => {
  const router = express.Router();

  router.get("/", getUserAtSensitivity(50));
  router.get("/details", resolveUserMiddleware, getFullUserData);
  router.get("/range", getUsers);
  router.get("/all", isRank(process.env.ELEVATED_DEVELOPER), getAllUsers);

  router.get("/set", setUserDataRaw);

  return router;
};

export { getStaffUserRoutes };
