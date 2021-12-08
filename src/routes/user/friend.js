import express from "express";
import {
  sendError,
  AlreadyFriendsError,
  GenericError,
  NoFriendRequestError,
  PendingFriendRequestError,
  SelfFriendRequestError,
} from "../../errors/apierrors.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { resolveUserMiddleware } from "../../middleware/data.middleware.js";
import { usersAreFriends, orderedFriendQuery } from "../../utils/database.js";
import { getEpoch } from "../../utils/funcs.js";

const getFriendCount = async (req, res) => {
  const [countError, friendCount] = await global.db
    .table("friendship")
    .count({ user1: req.user.id, user2: req.user.id }, "OR");
  if (countError) {
    return sendError(res, new GenericError());
  }

  return res.send({ count: friendCount });
};

const sendFriendRequest = async (req, res) => {
  if (req.authenticatedUser.id === req.user.id) {
    return sendError(res, new SelfFriendRequestError());
  }

  // Check if already friends
  const [checkfriendshipError, areAlreadyFriends] = await usersAreFriends(req.authenticatedUser, req.user);
  if (checkfriendshipError) {
    return sendError(res, new GenericError());
  }

  if (areAlreadyFriends) {
    return sendError(res, new AlreadyFriendsError());
  }

  // Check there isnt an existing friend request
  let friendRequestQuery = { from: req.authenticatedUser.id, to: req.user.id };

  const [getRequestError, friendRequest] = await global.db.table("friend_request").first("*", friendRequestQuery);
  if (getRequestError) {
    return sendError(res, new GenericError());
  }

  if (friendRequest) {
    return sendError(res, new PendingFriendRequestError());
  }

  const newFriendRequest = {
    from: req.authenticatedUser.id,
    to: req.user.id,
    sent_at: getEpoch(),
  };

  const [createFriendError, _] = await global.db.table("friend_request").new(newFriendRequest);
  if (createFriendError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const acceptFriendRequest = async (req, res) => {
  // Check friend request was sent
  let friendRequestQuery = { from: req.user.id, to: req.authenticatedUser.id };

  const [getRequestError, friendRequest] = await global.db.table("friend_request").first("*", friendRequestQuery);
  if (getRequestError) {
    return sendError(res, new GenericError());
  }

  if (!friendRequest) {
    return sendError(res, new NoFriendRequestError());
  }

  // Check not already friends
  const [checkfriendshipError, areAlreadyFriends] = await usersAreFriends(req.authenticatedUser, req.user);
  if (checkfriendshipError) {
    return sendError(res, new GenericError());
  }

  if (areAlreadyFriends) {
    return sendError(res, new AlreadyFriendsError());
  }

  const newFriendship = {
    ...orderedFriendQuery(req.authenticatedUser, req.user),
    friends_since: getEpoch(),
  };

  // Create friendship
  const [createFriendshipError] = await global.db.table("friendship").new(newFriendship);
  if (createFriendshipError) {
    return sendError(res, new GenericError());
  }

  // Delete friend request
  const [deleteRequestError] = await global.db.table("friend_request").delete(friendRequestQuery);
  if (deleteRequestError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const getAllFriendRequests = async (req, res) => {
  const [getRequestError, friendRequests] = await global.db
    .table("friend_request")
    .all("*", { to: req.authenticatedUser.id });
  if (getRequestError) {
    return sendError(res, new GenericError());
  }

  let filteredRequests = friendRequests.map((friendRequest) =>
    global.db.table("friend_request").filter(friendRequest, 0)
  );

  return res.send({
    friend_requests: filteredRequests,
  });
};

const getUserFriendRoutes = () => {
  const router = express.Router();

  router.get("/count", resolveUserMiddleware, getFriendCount);
  router.get("/request/all", isAuthenticated, getAllFriendRequests);
  router.post("/request/send", isAuthenticated, resolveUserMiddleware, sendFriendRequest);
  router.post("/request/accept", isAuthenticated, resolveUserMiddleware, acceptFriendRequest);

  return router;
};

export { getUserFriendRoutes };
