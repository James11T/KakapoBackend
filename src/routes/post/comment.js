import express from "express";
import {
  sendError,
  GenericError,
  MissingParametersError,
  CommentNotFoundError,
  BadParametersError,
  NotCommentOwnerError,
} from "../../errors/apierrors.js";
import { checkRequiredParameters } from "../../utils/validations.js";
import { getEpoch, generatePublicId, clamp } from "../../utils/funcs.js";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { paramCommentMiddleware, paramPostMiddleware } from "../../middleware/data.middleware.js";

const getComment = async (req, res) => {
  return res.send({ comment: global.db.table("comment").filter(req.comment, 0) });
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
    author: req.authenticatedUser.id,
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
    post: req.post.public_id,
  };

  return res.send({ success: true, comment: commentExport });
};

const deletePostComment = async (req, res) => {
  if (req.authenticatedUser.id !== req.comment.author.id) {
    return sendError(res, new NotCommentOwnerError());
  }

  const [deleteCommentError, deleteCommentResult] = await global.db.table("comment").delete({ id: req.comment.id });
  if (deleteCommentError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const editPostComment = async (req, res) => {
  if (req.authenticatedUser.id !== req.comment.author.id) {
    return sendError(res, new NotCommentOwnerError());
  }

  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["content"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { content } = req.body;
  let trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return sendError(res, new BadParametersError({ badParameters: ["content"] }));
  }

  const [editCommentError, editCommentResult] = await global.db
    .table("comment")
    .edit({ id: req.comment.id }, { content: trimmedContent });
  if (editCommentError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true, content: trimmedContent });
};

const getCommentsInRange = async (req, res) => {
  let { from = 0, count = 10 } = req.query;

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

  const [queryError, queryResults] = await global.db.table("comment").limit("*", { post: req.post.id }, from, count);
  if (queryError) {
    return sendError(res, new GenericError());
  }

  return res.send({
    comments: queryResults.map((comment) => global.db.table("comment").filter(comment, 0)),
  });
};

const getPostCommentRoutes = () => {
  const router = express.Router();

  router.get("/:comment_id", paramCommentMiddleware, getComment);
  router.post("/:post_id", isAuthenticated, paramPostMiddleware, addPostComment);
  router.put("/:comment_id", isAuthenticated, paramCommentMiddleware, editPostComment);
  router.delete("/:comment_id", isAuthenticated, paramCommentMiddleware, deletePostComment);

  router.get("/count/:post_id", paramPostMiddleware, getCommentCount);
  router.get("/range/:post_id", paramPostMiddleware, getCommentsInRange);

  return router;
};

export { getPostCommentRoutes };
