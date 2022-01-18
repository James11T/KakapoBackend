import express from "express";
import { Op } from "sequelize";

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
import { db } from "../../database.js";

/**
 * Get a user from the database with added info like post, comment and friend count
 */
const getFullUserData = async (req, res) => {
  let postCount, friendCount, commentCount;

  try {
    const userId = req.user.id;
    postCount = await db.models.post.count({ where: { author: userId } });

    friendCount = await db.models.friendship.count({
      where: { [Op.or]: [{ user1: userId }, { user2: userId }] },
    });

    commentCount = await db.models.comment.count({ where: { author: userId } });
  } catch (error) {
    return sendError(
      res,
      new GenericError("Failed to retrieve extra user data.")
    );
  }

  // ADD FILTER
  return res.send({
    user: {
      ...req.user,
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

  try {
    const results = await db.models.user.findAll({
      limit: count,
      offset: from,
    });
    return res.send({
      // ADD FILTER
      users: results,
    });
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve user."));
  }
};

const getAllUsers = async (req, res) => {
  /**
   * Get all user entries
   */

  try {
    const result = await db.models.user.findAll();
    // ADD FILTER
    return res.send({
      users: result,
    });
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve all users."));
  }
};

const setDataDisplayName = async (req, res) => {
  const { value } = req.body;

  let trimmedDispayName = value.trim();
  if (!checkDisplayName(trimmedDispayName)) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  try {
    const newUser = await db.models.user.update(
      { display_name: trimmedDispayName },
      { where: { id: req.user.id } }
    );
    return res.send({ success: true, value: newUser.display_name });
  } catch (error) {
    return sendError(res, new GenericError("Failed to set display name."));
  }
};

const setDataKakapoID = async (req, res) => {
  const { value } = req.body;

  let trimmedKakapoID = value.trim();
  if (!checkKakapoId(trimmedKakapoID)) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  const [checkIDError, isInUse] = await isKakapoIDInUse(trimmedKakapoID);
  if (checkIDError) {
    return sendError(res, new GenericError("Failed to check kakapo ID."));
  }
  if (isInUse) {
    return sendError(res, new KakapoIDReservedError());
  }

  try {
    const newUser = await db.models.user.update(
      { kakapo_id: trimmedKakapoID },
      { where: { id: req.user.id } }
    );
    return res.send({ success: true, value: newUser.kakapo_id });
  } catch (error) {
    return sendError(res, new GenericError("Failed to update kakapo ID."));
  }
};

const setDataRank = async (req, res) => {
  const { value } = req.body;

  if (typeof value !== "number" || clamp(value, 0, 255) !== value) {
    return sendError(res, new BadParametersError({ badParameters: ["value"] }));
  }

  try {
    const newUser = await db.models.user.update(
      { rank: value },
      { where: { id: req.user.id } }
    );
    return res.send({ success: true, value: newUser.rank });
  } catch (error) {
    return sendError(res, new GenericError("Failed to update rank."));
  }
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

  try {
    const newUser = await db.models.user.update(
      { badge: value },
      { where: { id: req.user.id } }
    );
    return res.send({ success: true, value: newUser.badge });
  } catch (error) {
    return sendError(res, new GenericError("Failed to update badge."));
  }
};

const getUser = async (req, res) => {
  // ADD FILTER
  return res.send({ user: req.user });
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
