import express from "express";

import { clamp } from "../../utils/funcs.js";
import { checkDisplayName, checkKakapoId } from "../../utils/validations.js";
import { isRank, rankExceeds } from "../../middleware/auth.middleware.js";
import { requireData } from "../../middleware/request.middleware.js";
import { paramUserMiddleware } from "../../middleware/data.middleware.js";
import {
  BadParametersError,
  GenericError,
  KakapoIDReservedError,
  RankTooLowError,
  sendError,
} from "../../errors/apierrors.js";
import { isKakapoIDInUse } from "../../utils/database.js";

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

const setDataDisplayName = async (req, res) => {
  const { value } = req.body;

  let trimmedDispayName = value.trim();
  if (!checkDisplayName(trimmedDispayName)) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  const [setDisplayNameError, setResult] = await global.db
    .table("user")
    .edit({ id: req.user.id }, { display_name: trimmedDispayName });
  if (setDisplayNameError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true, value: trimmedDispayName });
};

const setDataKakapoID = async (req, res) => {
  const { value } = req.body;

  let trimmedKakapoID = value.trim();
  if (!checkKakapoId(trimmedKakapoID)) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  const [checkIDError, isInUse] = await isKakapoIDInUse(trimmedKakapoID);
  if (checkIDError) {
    return sendError(res, new GenericError());
  }
  if (isInUse) {
    return sendError(res, new KakapoIDReservedError());
  }

  const [setKakapoIDError, setResult] = await global.db
    .table("user")
    .edit({ id: req.user.id }, { kakapo_id: trimmedKakapoID });
  if (setKakapoIDError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true, value: trimmedKakapoID });
};

const setDataRank = async (req, res) => {
  const { value } = req.body;

  if (typeof value !== "number" || clamp(value, 0, 255) !== value) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  const [setRankError, setResult] = await global.db.table("user").edit({ id: req.user.id }, { rank: value });
  if (setRankError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true, value: value });
};

const badgeRanks = [0, 70, 70, 100, 50, 255, 255];

const setDataBadge = async (req, res) => {
  const { value } = req.body;

  if (typeof value !== "number" || clamp(value, 0, 6) !== value) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  if (req.authenticatedUser.rank < badgeRanks[value]) {
    return sendError(res, new RankTooLowError());
  }

  const [setRankError, setResult] = await global.db.table("user").edit({ id: req.user.id }, { badge: value });
  if (setRankError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true, value: value });
};

const getUser = async (req, res) => {
  return res.send({ user: global.db.table("user").filter(req.user, 50) });
};

const getStaffUserRoutes = () => {
  const router = express.Router();

  const requireValueMiddleware = requireData(["value"]);

  router.get("/details/:kakapo_id", paramUserMiddleware, getFullUserData);
  router.get("/range", getUsers);
  router.get("/all", isRank(process.env.ELEVATED_DEVELOPER), getAllUsers);
  router.get("/:kakapo_id", paramUserMiddleware, getUser);

  router.put(
    "/data/displayname/:kakapo_id",
    isRank(process.env.RANK_MODERATOR),
    requireValueMiddleware,
    paramUserMiddleware,
    rankExceeds,
    setDataDisplayName
  );
  router.put(
    "/data/kakapoid:kakapo_id",
    isRank(process.env.ADMIN),
    requireValueMiddleware,
    paramUserMiddleware,
    rankExceeds,
    setDataKakapoID
  );
  router.put(
    "/data/rank:kakapo_id",
    isRank(process.env.ADMIN),
    requireValueMiddleware,
    paramUserMiddleware,
    rankExceeds,
    setDataRank
  );
  router.put(
    "/data/badge:kakapo_id",
    isRank(process.env.RANK_MODERATOR),
    requireValueMiddleware,
    paramUserMiddleware,
    rankExceeds,
    setDataBadge
  );

  return router;
};

export { getStaffUserRoutes };
