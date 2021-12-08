import express from "express";
import {
  GenericError,
  MissingParametersError,
  CommentNotFoundError,
  BadParametersError,
  NotCommentOwnerError
} from "../../errors/apierrors.js";
import { checkRequiredParameters, getEpoch, generatePublicId } from "../../utils.js";
import { isAuthenticated } from "../../middleware/auth.js";
import { resolvePostMiddleware, resolveCommentMiddleware } from "../../middleware/data.js";

const getComment = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["comment_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { comment_id } = req.body;

  const [getCommentError, comment] = await global.db.table("comment").first("*", { public_id: comment_id });
  if (getCommentError) {
    return sendError(res, new GenericError());
  }

  if (!comment) {
    return sendError(res, new CommentNotFoundError());
  }

  return res.send({ comment: globa.db.table("comment").filter(comment, 0) });
};

const getCommentCount = async (req, res) => {
  const [countError, count] = await global.db.table("comment").count({ post: req.post.id });
  if (countError) {
    return sendError(res, new GenericError());
  }

  return res.send({ count: count });
};

const addPostComment = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["content"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { content } = req.body;
  let trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return sendError(res, new BadParametersError({ badParameters: ["content"] }));
  }

  const newComment = {
    post: req.post.id,
    content: trimmedContent,
    commented_at: getEpoch(),
    public_id: generatePublicId(),
  };
  const [createCommentError] = await global.db.table("comment").new(newComment);
  if (createCommentError) {
    return sendError(res, new GenericError());
  }

  const commentExport = {
    id: newComment.public_id,
    content: newComment.content,
    commented_at: newComment.commented_at,
    post: req.post.public_id
  }

  return res.send({ success: true, comment: commentExport });
};

const deletePostComment = async (req, res) => {
  if (req.user.id !== req.comment.author.id) {
    return sendError(res, new NotCommentOwnerError());
  }
};

const editPostComment = async (req, res) => {};

const getCommentsInRange = async (req, res) => {};

const getPostCommentRoutes = () => {
  const router = express.Router();

  router.get("/", getComment);
  router.post("/", isAuthenticated, resolvePostMiddleware, addPostComment);
  router.put("/", isAuthenticated, resolveCommentMiddleware, editPostComment);
  router.delete("/", isAuthenticated, resolveCommentMiddleware, deletePostComment);

  router.get("/count", resolvePostMiddleware, getCommentCount);
  router.get("/range", resolvePostMiddleware, getCommentsInRange);

  return router;
};

export { getPostCommentRoutes };
