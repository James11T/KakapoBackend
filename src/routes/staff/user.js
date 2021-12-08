import express from "express";

import { getUserAtSensitivity } from "../shared.js";
import { clamp } from "../../utils/funcs.js";
import { isRank } from "../../middleware/auth.middleware.js";
import { BadParametersError, GenericError } from "../../errors/apierrors.js";
import { resolveUserMiddleware } from "../../middleware/data.middleware.js";

const getFullUserData = async (req, res) => {
  const [postCountErr, postCount] = await global.db.table("post").count({ author: req.user.id });
  if (postCountErr) {
    return sendError(res, new GenericError());
  }

  return res.send({
    user: {
      ...global.db.table("user").filter(req.user, 50),
      post_count: postCount,
    },
  });
};

const getUsers = async (req, res) => {
  /**
   * Get 'count' user entries after the 'from'th entry
   *
   * URL Parameters:
   *   from: number
   *   count: number
   *
   * Defaults:
   *   'from': 0
   *   'count': 20
   *
   * Returns:
   *   {
   *     "users": [
   *       <USERS>
   *     ]
   *   }
   *
   * Example URLs:
   *   /user/getusers?from=0?count=5
   *   /user/getusers?count=3
   *   /user/getusers?from=7
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
   *
   * Returns:
   *   {
   *     "users": [
   *       <USERS>
   *     ]
   *   }
   *
   * Example URLs:
   *   /user/getallusers
   */

  const [queryError, queryResults] = await global.db.table("user").all();
  if (queryError) {
    return sendError(res, new GenericError());
  }

  return res.send({
    users: queryResults.map((user) => global.db.table("user").filter(user, 50)),
  });
};

const getStaffUserRoutes = () => {
  const router = express.Router();

  router.get("/getuser", getUserAtSensitivity(50));
  router.get("/getuserdata", resolveUserMiddleware, getFullUserData);
  router.get("/getusers", getUsers);
  router.get("/getallusers", isRank(process.env.ELEVATED_DEVELOPER), getAllUsers);

  return router;
};

export { getStaffUserRoutes };
