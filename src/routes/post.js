import express from "express";
import {
  BadParametersError,
  GenericError,
  MissingParametersError,
  NotPostOwnerError,
  NotYetImplementedError,
  sendError,
} from "../errors/apierrors.js";
import { getPostCommentRoutes } from "./post/comment.js";
import { getPostLikeRoutes } from "./post/like.js";
import { clamp, generatePublicId, getEpoch } from "../utils/funcs.js";
import { checkRequiredParameters } from "../utils/validations.js";
import { deletePost } from "../utils/database.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  paramPostMiddleware,
  paramUserMiddleware,
} from "../middleware/data.middleware.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

const getPost = async (req, res) => {
  return res.send({ post: req.post });
};

const createPost = async (req, res) => {
  let { content = "" } = req.body;
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(
    req.files,
    ["media"]
  );
  if (!hasRequiredParameters) {
    return sendError(
      res,
      new MissingParametersError({ missingParameters: missingParameters })
    );
  }

  const publicId = generatePublicId(16);
  const fileNameSplit = req.files.media.name.split(".");
  const extention = fileNameSplit[fileNameSplit.length - 1];
  const fn = `/static/post/${publicId}.${extention}`;

  req.files.media.mv(`.${fn}`);

  let newPostData = {
    author_id: req.authenticatedUser.id,
    media: fn,
    content: content,
    posted_at: getEpoch(),
    public_id: publicId,
  };

  try {
    const newPost = await Post.create(newPostData);
    return res.send({ success: true, post: newPost });
  } catch (error) {
    console.log(error);
    return sendError(res, new GenericError("Failed to create new post."));
  }
};

const deletePostEndpoint = async (req, res) => {
  if (req.post.author.public_id !== req.authenticatedUser.public_id) {
    return sendError(res, new NotPostOwnerError());
  }

  const deletePostSuccess = await deletePost(req.post);
  if (!deletePostSuccess) {
    return sendError(res, new GenericError("Failed to delete post."));
  }

  return res.send({ success: true });
};

const editPost = async (req, res) => {
  if (req.post.author.public_id !== req.authenticatedUser.public_id) {
    return sendError(res, new NotPostOwnerError());
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

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0 || trimmedContent.length > 256) {
    return sendError(
      res,
      new BadParametersError({ badParameters: ["content"] })
    );
  }

  try {
    await Post.update(
      { edited: true, content: trimmedContent },
      {
        where: { public_id: req.post.public_id },
        include: [{ model: User, as: "author", foreignKey: "author_id" }],
      }
    );
    return res.send({ success: true, content: trimmedContent });
  } catch (error) {
    return sendError(res, new GenericError("Failed to edit post."));
  }
};

const repostPost = async (req, res) => {
  return sendError(res, new NotYetImplementedError());
};

const getUserPosts = async (req, res) => {
  let { after, before, count = 20 } = req.query;

  if (!after && !before) {
    return sendError(
      res,
      new MissingParametersError({ missingParameters: ["after", "before"] })
    );
  }

  count = clamp(count, 1, 40);
  from = Math.max(from, 0); // Minimum 0

  try {
    const results = await Post.findAll({
      limit: count,
      offset: from,
      where: { author_id: req.user.id },
      include: [{ model: User, as: "author", foreignKey: "author_id" }],
    });
    return res.send({
      // ADD FILTER
      posts: results,
    });
  } catch (error) {
    return sendError(res, new GenericError("Failed to retrieve posts."));
  }
};

const getPostRoutes = () => {
  const router = express.Router();

  router.get("/:post_id", paramPostMiddleware, getPost);
  router.post("/", isAuthenticated, createPost);
  router.delete(
    "/:post_id",
    isAuthenticated,
    paramPostMiddleware,
    deletePostEndpoint
  );
  router.get("/by/:kakapo_id", paramUserMiddleware, getUserPosts);
  router.put("/:post_id", isAuthenticated, paramPostMiddleware, editPost);

  router.post(
    "/repost/:post_id",
    isAuthenticated,
    paramPostMiddleware,
    repostPost
  );

  router.use("/like", getPostLikeRoutes());
  router.use("/comment", getPostCommentRoutes());

  return router;
};

export { getPostRoutes };
