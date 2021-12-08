import express from "express";

import {
  sendError,
  BadParametersError,
  QueryFailedError,
  MissingParametersError,
  NoEntryError,
  DatabaseError,
} from "../../errors/apierrors.js";
import { isRank } from "../../middleware/auth.js";
import { clamp } from "../../utils.js";
import { isAuthenticated } from "../../middleware/auth.js";
import { getUserAtSensitivity } from "./shared.js";

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

  let { from = 0, count = 20 } = req.query;

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
    return sendError(res, new QueryFailedError());
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
    return sendError(res, new QueryFailedError());
  }

  return res.send({
    users: queryResults.map((user) => global.db.table("user").filter(user, 50)),
  });
};

const getMe = async (req, res) => {
  return res.send({ user: global.db.table("user").filter(req.user, 10) });
};

const kakapoIDTakenCheck = async (req, res) => {
  const kakapo_id = req.params.kakapoId;
  if (!kakapo_id) {
    return sendError(res, new MissingParametersError());
  }

  const [getUserError, user] = await global.db.table("user").first(["kakapo_id"], { kakapo_id: kakapo_id });
  if (getUserError) {
    return sendError(res, new DatabaseError());
  }

  return res.send({ taken: !!user });
};

const createUser = async (req, res) => {
  const data = req.body;
  if (!data.display_name) {
    data.display_name = data.kakapo_id;
  }

  const [createUserError, createUserResult] = await global.db.table("user").new(req.body);
  if (createUserError) {
    return sendError(res, createUserError);
  }

  return res.send({ message: "User created successfully" });
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

  router.get("/getusers", isRank(process.env.RANK_ADMIN), getUsers);
  router.get("/getallusers", isRank(process.env.ELEVATED_DEVELOPER), getAllUsers);
  router.get("/getuser/:kakapoId", getUserAtSensitivity(0));
  router.get("/me", isAuthenticated, getMe);
  router.get("/kakapoidtaken/:kakapoId", kakapoIDTakenCheck);
  router.get("/count", getUserCount);

  router.post("/createuser", isRank(process.env.ELEVATED_DEVELOPER), createUser);
  return router;
};

export { getUserRoutes };
