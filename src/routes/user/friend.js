import express from "express";
import { Op } from "sequelize";
import { db } from "../../database.js";
import {
  sendError,
  AlreadyFriendsError,
  GenericError,
  NoFriendRequestError,
  PendingFriendRequestError,
  SelfFriendRequestError,
} from "../../errors/apierrors.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { paramUserMiddleware } from "../../middleware/data.middleware.js";
import { usersAreFriends, orderedFriendQuery } from "../../utils/database.js";
import { getEpoch } from "../../utils/funcs.js";

const getFriendCount = async (req, res) => {
  try {
    const count = await db.models.friendship.count({
      where: { [Op.or]: [{ user1: req.user }, { user2: req.user }] },
    });
    return res.send({ count: count, user: req.user });
  } catch (error) {
    return sendError(res, new GenericError("Failed to count friends."));
  }
};

const sendFriendRequest = async (req, res) => {
  if (req.authenticatedUser.id === req.user.id) {
    return sendError(res, new SelfFriendRequestError());
  }

  // Check if already friends
  const [checkfriendshipError, areAlreadyFriends] = await usersAreFriends(
    req.authenticatedUser,
    req.user
  );
  if (checkfriendshipError) {
    return sendError(res, new GenericError("Failed to retrieve friendship."));
  }

  if (areAlreadyFriends) {
    return sendError(res, new AlreadyFriendsError());
  }

  // Check there isnt an existing friend request
  try {
    const friendRequest = await db.models.friend_request.findOne({
      where: { from: req.authenticatedUser.id, to: req.user.id },
    });
    if (friendRequest) {
      return sendError(res, new PendingFriendRequestError());
    }
  } catch (error) {
    return sendError(
      res,
      new GenericError("Failed to retrieve friend request.")
    );
  }

  const newFriendRequestData = {
    from: req.authenticatedUser.id,
    to: req.user.id,
    sent_at: getEpoch(),
  };

  try {
    await db.models.friend_request.create(newFriendRequestData);
    return res.send({ success: true });
  } catch (error) {
    return sendError(res, new GenericError("Failed to create friend request."));
  }
};

const acceptFriendRequest = async (req, res) => {
  // Check friend request was sent
  let friendRequestQuery = { from: req.user.id, to: req.authenticatedUser.id };

  try {
    const friendRequest = await db.models.friend_request.findOne({
      where: friendRequestQuery,
    });
    if (!friendRequest) {
      return sendError(res, new NoFriendRequestError());
    }
  } catch (error) {
    return sendError(
      res,
      new GenericError("Failed to retrieve friend request.")
    );
  }

  // Check not already friends
  const [checkfriendshipError, areAlreadyFriends] = await usersAreFriends(
    req.authenticatedUser,
    req.user
  );
  if (checkfriendshipError) {
    return sendError(
      res,
      new GenericError("Failed to check if users are friends.")
    );
  }

  if (areAlreadyFriends) {
    return sendError(res, new AlreadyFriendsError());
  }

  const newFriendshipData = {
    ...orderedFriendQuery(req.authenticatedUser, req.user),
    friends_since: getEpoch(),
  };

  // Delete friend request
  try {
    await db.models.friend_request.destroy({ where: friendRequestQuery });
  } catch (err) {
    return sendError(res, new GenericError("Failed to delete friend request."));
  }

  // Create friendship
  try {
    await db.models.friendship.create(newFriendshipData);
  } catch (error) {
    return sendError(res, new GenericError("Failed to create friendship."));
  }

  return res.send({ success: true });
};

const getAllFriendRequests = async (req, res) => {
  try {
    const results = await db.models.friend_request.findAll({
      where: { to: req.authenticatedUser.id },
    });
    // ADD FILTER
    return res.send({
      friend_requests: results,
    });
  } catch (error) {
    return sendError(
      res,
      new GenericError("Failed to retrieve frient requests.")
    );
  }
};

const getUserFriendRoutes = () => {
  const router = express.Router();

  router.get("/count/:kakapo_id", paramUserMiddleware, getFriendCount);
  router.get("/request/all", isAuthenticated, getAllFriendRequests);
  router.post(
    "/request/send/:kakapo_id",
    isAuthenticated,
    paramUserMiddleware,
    sendFriendRequest
  );
  router.post(
    "/request/accept/:kakapo_id",
    isAuthenticated,
    paramUserMiddleware,
    acceptFriendRequest
  );

  return router;
};

export { getUserFriendRoutes };
