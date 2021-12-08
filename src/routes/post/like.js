import express from "express";
import {
  GenericError,
  sendError,
  MissingParametersError,
  PostNotFoundError,
  AlreadyLikedError,
  NotLikedError,
} from "../../errors/apierrors.js";
import { checkRequiredParameters, getEpoch } from "../../utils.js";
import { isAuthenticated } from "../../middleware/auth.js";
import { resolvePostMiddleware } from "../../middleware/data.js";

const getLikeCount = async (req, res) => {
  const [countError, count] = await global.db.table("like").count({ post: req.post.id });
  if (countError) {
    return sendError(res, new GenericError());
  }

  return res.send({ count: count });
};

const likePost = async (req, res) => {
  const [getLikerError, likerResult] = await global.db.table("like").first("*", { post: req.post.id, liker: req.user.id });
  if (getLikerError) {
    return sendError(res, new GenericError());
  }

  if (likerResult) {
    return sendError(res, new AlreadyLikedError());
  }

  const [createLikeError, createLikeResult] = await global.db
    .table("like")
    .new({ post: req.post.id, liker: req.user.id, liked_at: getEpoch() });
  if (createLikeError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const unlikePost = async (req, res) => {
  const [getLikerError, likerResult] = await global.db.table("like").first("*", { post: req.post.id, liker: req.user.id });
  if (getLikerError) {
    return sendError(res, new GenericError());
  }

  if (!likerResult) {
    return sendError(res, new NotLikedError());
  }

  const [deleteLikeError, deleteLikeResult] = await global.db
    .table("like")
    .delete({ post: req.post.id, liker: req.user.id });
  if (deleteLikeError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const getPostLikeRoutes = () => {
  const router = express.Router();

  router.get("/", resolvePostMiddleware, getLikeCount);
  router.post("/", isAuthenticated, resolvePostMiddleware, likePost);
  router.delete("/", isAuthenticated, resolvePostMiddleware, unlikePost);

  return router;
};

export { getPostLikeRoutes };
