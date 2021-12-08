import express from "express";
import { sendError, AlreadyFriendsError, GenericError, NoFriendRequestError } from "../../errors/apierrors.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { resolveUserMiddleware } from "../../middleware/data.middleware.js";
import { usersAreFriends, orderedFriendQuery } from "../../utils/database.js";
import { getEpoch } from "../../utils/funcs.js";

const getFriendCount = async (req, res) => {
  const [countError, friendCount] = await global.db.table("friend_request").count();
  if (countError) {
    return sendError(res, new GenericError());
  }

  return res.send({ count: friendCount });
};

const sendFriendRequest = async (req, res) => {
  let newFR = {
    from: req.authenticatedUser.id,
    to: req.user.id,
    sent_at: getEpoch(),
  };

  const [checkfriendshipError, areAlreadyFriends] = await usersAreFriends(req.authenticatedUser, req.user);
  if (checkfriendshipError) {
    return sendError(res, new GenericError());
  }

  if (areAlreadyFriends) {
    return sendError(res, new AlreadyFriendsError());
  }

  const [createFriendError, _] = await global.db.table("friend_request").new(newFR);
  if (createFriendError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const acceptFriendRequest = async (req, res) => {
  // Check friend request was sent
  let friendRequestQuery = { from: req.user.id, to: req.authenticatedUser.id };

  const [getRequestError, friendRequest] = await global.db.table("friend_request").first(["*"], friendRequestQuery);

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

const getUserFriendRoutes = () => {
  const router = express.Router();

  router.get("/count", getFriendCount);
  router.post("/send", isAuthenticated, resolveUserMiddleware, sendFriendRequest);
  router.post("/accept", isAuthenticated, resolveUserMiddleware, acceptFriendRequest);

  return router;
};

export { getUserFriendRoutes };
