import express from "express";

import { getUserAtSensitivity } from "../shared.js";
import { checkRequiredParameters, clamp } from "../../utils.js";
import { isRank } from "../../middleware/auth.middleware.js";
import { BadParametersError, GenericError, MissingParametersError, UserNotFoundError } from "../../errors/apierrors.js";

const getFullUserData = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["kakapo_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { kakapo_id } = req.body;

  const [getUserError, user] = await global.db.table("user").first("*", { kakapo_id: kakapo_id });
  if (getUserError) {
    return sendError(res, new GenericError());
  }

  if (!user) {
    return sendError(res, new UserNotFoundError());
  }

  const [postCountErr, postCount] = await global.db.table("post").count({ kakapo_id: kakapo_id });
  if (postCountErr) {
    return sendError(res, new GenericError());
  }

  return res.send({ user: { ...global.db.table("user").filter(user, 50), post_count: postCount } });
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
    count = Number(count);
  } catch (castingError) {
    // Provided parameters are not numbers
    return sendError(res, new BadParametersError());
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

  router.post("/getuser", getUserAtSensitivity(50));
  router.post("/getuserdata", getFullUserData);
  router.get("/getusers", getUsers);
  router.get("/getallusers", isRank(process.env.ELEVATED_DEVELOPER), getAllUsers);

  return router;
};

export { getStaffUserRoutes };
