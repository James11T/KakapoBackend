import express from "express";
import {
  GenericError,
  sendError,
  AlreadyLikedError,
  NotLikedError,
} from "../../errors/apierrors.js";
import { getEpoch } from "../../utils/funcs.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { paramPostMiddleware } from "../../middleware/data.middleware.js";
import Like from "../../models/like.model.js";

const getLikeCount = async (req, res) => {
  try {
    const count = await Like.count({
      where: { post_id: req.post.id },
    });
    return res.send({ count: count });
  } catch (error) {
    return sendError(res, new GenericError("Failed to count likes."));
  }
};

const likePost = async (req, res) => {
  try {
    const likeResult = await Like.findOne({
      where: {
        post_id: req.post.id,
        liker_id: req.authenticatedUser.id,
      },
    });

    if (likeResult) {
      return sendError(res, new AlreadyLikedError());
    }
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve like."));
  }

  const newLikeData = {
    post_id: req.post.id,
    liker_id: req.authenticatedUser.id,
    liked_at: getEpoch(),
  };

  try {
    await Like.create(newLikeData);
    return res.send({ success: true });
  } catch (error) {
    return sendError(res, new GenericError("Failed to create new like."));
  }
};

const unlikePost = async (req, res) => {
  try {
    const getLike = await Like.findOne({
      where: { post_id: req.post.id, liker_id: req.authenticatedUser.id },
    });
    if (!getLike) {
      return sendError(res, new NotLikedError());
    }
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve like."));
  }

  try {
    await Like.destroy({
      where: { post_id: req.post.id, liker_id: req.authenticatedUser.id },
    });
    return res.send({ success: true });
  } catch (error) {
    return sendError(res, new GenericError("Failed to delete like."));
  }
};

const getPostLikeRoutes = () => {
  const router = express.Router();

  router.get("/count/:post_id", paramPostMiddleware, getLikeCount);
  router.post("/:post_id", isAuthenticated, paramPostMiddleware, likePost);
  router.delete("/:post_id", isAuthenticated, paramPostMiddleware, unlikePost);

  return router;
};

export { getPostLikeRoutes };
