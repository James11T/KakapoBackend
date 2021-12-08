import express from "express";
import { sendError, AlreadyFriendsError, GenericError, NoFriendRequestError } from "../../errors/apierrors.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { resolveUserMiddleware } from "../../middleware/data.middleware.js";
import { getEpoch } from "../../utils.js";

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
  let friendshipQuery;
  if (req.authenticatedUser.id < req.user.id) {
    friendshipQuery = { user1: req.authenticatedUser.id, user2: req.user.id };
  } else {
    friendshipQuery = { user1: req.user.id, user2: req.authenticatedUser.id };
  }

  const [getFriendshipError, existingFiendRequest] = await global.db.table("friendship").first(["*"], friendshipQuery);
  if (getFriendshipError) {
    return sendError(res, new GenericError());
  }

  if (existingFiendRequest) {
    return sendError(res, new AlreadyFriendsError());
  }

  // Create friendship
  const [createFriendshipError, createFriendshipResult] = await global.db
    .table("friendship")
    .new({ ...friendshipQuery, friends_since: getEpoch() });
  if (createFriendshipError) {
    return sendError(res, new GenericError());
  }

  // Delete friend request
  const [deleteRequestError, deleteRequestResult] = await global.db.table("friend_request").delete(friendRequestQuery);
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
