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
import { db } from "../../database.js";

const getLikeCount = async (req, res) => {
  try {
    const count = await db.models.like.count({ where: { post: req.post.id } });
    return res.send({ count: count });
  } catch (error) {
    return sendError(res, new GenericError("Failed to count likes."));
  }
};

const likePost = async (req, res) => {
  try {
    const likeResult = await db.models.like.findOne({
      where: {
        post: req.post.id,
        liker: req.authenticatedUser.id,
      },
    });

    if (likeResult) {
      return sendError(res, new AlreadyLikedError());
    }
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve like."));
  }

  const newLikeData = {
    post: req.post.id,
    liker: req.authenticatedUser.id,
    liked_at: getEpoch(),
  };

  try {
    await db.models.like.create(newLikeData);
    return res.send({ success: true });
  } catch (error) {
    return sendError(res, new GenericError("Failed to create new like."));
  }
};

const unlikePost = async (req, res) => {
  try {
    const getLike = await db.models.like.findOne({
      where: { post: req.post.id, liker: req.authenticatedUser.id },
    });
    if (!getLike) {
      return sendError(res, new NotLikedError());
    }
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve like."));
  }

  try {
    await db.models.like.destroy({
      where: { post: req.post.id, liker: req.authenticatedUser.id },
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
