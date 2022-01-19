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
import {
  paramCommentMiddleware,
  paramPostMiddleware,
} from "../../middleware/data.middleware.js";
import { db } from "../../database.js";
import Comment from "../../models/comment.model.js";
import User from "../../models/user.model.js";

const getComment = async (req, res) => {
  return res.send({
    // ADD FILTER
    comment: req.comment,
  });
};

const getCommentCount = async (req, res) => {
  try {
    const count = await Comment.count({
      where: {
        post: req.post.id,
      },
    });
    return res.send({ count: count });
  } catch (error) {
    return sendError(res, new GenericError("Failed to count comments."));
  }
};

const addPostComment = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(
    req.body,
    ["content"]
  );
  if (!hasRequiredParameters) {
    return sendError(
      res,
      new MissingParametersError({ missingParameters: missingParameters })
    );
  }

  const { content } = req.body;
  let trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return sendError(
      res,
      new BadParametersError({ badParameters: ["content"] })
    );
  }

  const newCommentData = {
    post: req.post.id,
    content: trimmedContent,
    commented_at: getEpoch(),
    author: req.authenticatedUser.id,
    public_id: generatePublicId(),
  };

  try {
    const newComment = await Comment.create(newCommentData);

    return res.send({
      success: true,
      comment: {
        id: newComment.public_id,
        content: newComment.content,
        commented_at: newComment.commented_at,
        post: req.post.public_id,
      },
    });
  } catch (error) {
    return sendError(res, new GenericError("Failed to create new comment."));
  }
};

const deletePostComment = async (req, res) => {
  if (req.authenticatedUser.id !== req.comment.author.id) {
    return sendError(res, new NotCommentOwnerError());
  }

  try {
    await User.destroy({ where: { id: req.comment.id } });
    return res.send({ success: true });
  } catch (error) {
    return sendError(res, new GenericError("Failed to delete comment."));
  }
};

const editPostComment = async (req, res) => {
  if (req.authenticatedUser.id !== req.comment.author.id) {
    return sendError(res, new NotCommentOwnerError());
  }

  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(
    req.body,
    ["content"]
  );
  if (!hasRequiredParameters) {
    return sendError(
      res,
      new MissingParametersError({ missingParameters: missingParameters })
    );
  }

  const { content } = req.body;
  let trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return sendError(
      res,
      new BadParametersError({ badParameters: ["content"] })
    );
  }

  try {
    const newComment = await Comment.update(
      { content: trimmedContent },
      {
        where: {
          id: req.comment.id,
        },
      }
    );
    return res.send({ success: true, content: newComment.content });
  } catch (error) {
    return sendError(res, new GenericError("Failed to edit comment."));
  }
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

  try {
    const results = await Comment.findAll({
      limit: count,
      offset: from,
      where: {
        post: req.post.id,
      },
    });
    return res.send({
      // ADD FILTER
      comments: results,
    });
  } catch (error) {
    return sendError(res, new GenericError("Failed to get comments."));
  }
};

const getPostCommentRoutes = () => {
  const router = express.Router();

  router.get("/:comment_id", paramCommentMiddleware, getComment);
  router.post(
    "/:post_id",
    isAuthenticated,
    paramPostMiddleware,
    addPostComment
  );
  router.put(
    "/:comment_id",
    isAuthenticated,
    paramCommentMiddleware,
    editPostComment
  );
  router.delete(
    "/:comment_id",
    isAuthenticated,
    paramCommentMiddleware,
    deletePostComment
  );

  router.get("/count/:post_id", paramPostMiddleware, getCommentCount);
  router.get("/range/:post_id", paramPostMiddleware, getCommentsInRange);

  return router;
};

export { getPostCommentRoutes };
