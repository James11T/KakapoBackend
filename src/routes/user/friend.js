import express from "express";
import {
  sendError,
  AlreadyFriendsError,
  GenericError,
  MissingParametersError,
  NoFriendRequestError,
  UserNotFoundError,
} from "../../errors/apierrors.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { checkRequiredParameters, getEpoch } from "../../utils.js";

const getFriendCount = async (req, res) => {
  const [countError, friendCount] = await global.db.table("friend_request").count();
  if (countError) {
    return sendError(res, new GenericError());
  }

  return res.send({ count: friendCount });
};

const sendFriendRequest = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["kakapo_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { kakapo_id } = req.body;
  const [getUserError, user] = await global.db.table("user").first(["kakapo_id"], { kakapo_id: kakapo_id });
  if (getUserError) {
    return sendError(res, new GenericError());
  }

  if (!user) {
    return sendError(res, new UserNotFoundError());
  }

  let newFR = {
    from: req.authenticatedUser.id,
    to: user.id,
    sent_at: getEpoch(),
  };

  const [createFriendError, _] = await global.db.table("friend_request").new(newFR);

  if (createFriendError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const acceptFriendRequest = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["kakapo_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  // Get the user who the friend request is from
  const { kakapo_id } = req.body;

  const [getUserError, fromUser] = await global.db.table("user").first(["kakapo_id"], { kakapo_id: kakapo_id });
  if (getUserError) {
    return sendError(res, new GenericError());
  }

  if (!fromUser) {
    return sendError(res, new UserNotFoundError());
  }

  // Check friend request was sent
  let friendRequestQuery = { from: fromUser.id, to: req.authenticatedUser.id };

  const [getRequestError, friendRequest] = await global.db.table("friend_request").first(["*"], friendRequestQuery);

  if (getRequestError) {
    return sendError(res, new GenericError());
  }

  if (!friendRequest) {
    return sendError(res, new NoFriendRequestError());
  }

  // Check not already friends
  let friendshipQuery;
  if (req.authenticatedUser.id < fromUser.id) {
    friendshipQuery = { user1: req.authenticatedUser.id, user2: fromUser.id };
  } else {
    friendshipQuery = { user1: fromUser.id, user2: req.authenticatedUser.id };
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
  router.post("/send", isAuthenticated, sendFriendRequest);
  router.post("/accept", isAuthenticated, acceptFriendRequest);

  return router;
};

export { getUserFriendRoutes };
