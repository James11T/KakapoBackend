import express from "express";
import {
  BadParametersError,
  GenericError,
  MissingParametersError,
  NotPostOwnerError,
  sendError,
} from "../errors/apierrors.js";
import { getPostCommentRoutes } from "./post/comment.js";
import { getPostLikeRoutes } from "./post/like.js";
import { generatePublicId, getEpoch } from "../utils/funcs.js";
import { checkRequiredParameters } from "../utils/validations.js";
import { deletePost } from "../utils/database.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { paramPostMiddleware } from "../middleware/data.middleware.js";

const getPost = async (req, res) => {
  return res.send({ post: global.db.table("post").filter(req.post, 0) });
};

const createPost = async (req, res) => {
  let { content = "" } = req.body;
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.files, ["media"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const publicId = generatePublicId(16);
  const fileNameSplit = req.files.media.name.split(".");
  const extention = fileNameSplit[fileNameSplit.length - 1];
  const fn = `/static/post/${publicId}.${extention}`;

  req.files.media.mv(`.${fn}`);

  let newPost = {
    author: req.authenticatedUser.id,
    media: fn,
    content: content,
    posted_at: getEpoch(),
    public_id: publicId,
  };

  const [createPostError, createPostResult] = await global.db.table("post").new(newPost);
  if (createPostError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true, location: newPost.public_id });
};

const deletePostEndpoint = async (req, res) => {
  if (req.post.author.public_id !== req.authenticatedUser.public_id) {
    return sendError(res, new NotPostOwnerError());
  }

  const [deletePostError] = await deletePost(req.post);
  if (deletePostError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const editPost = async (req, res) => {
  if (req.post.author.public_id !== req.authenticatedUser.public_id) {
    return sendError(res, new NotPostOwnerError());
  }

  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["content"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { content } = req.body;

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0 || trimmedContent.length > 256) {
    return sendError(res, new BadParametersError({ badParameters: ["content"] }));
  }

  const [editPostError, editPostResult] = await global.db
    .table("post")
    .edit({ public_id: req.post.public_id }, { edited: true, content: trimmedContent });
  if (editPostError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const repostPost = async (req, res) => {};

const getPostRoutes = () => {
  const router = express.Router();

  router.get("/:post_id", paramPostMiddleware, getPost);
  router.post("/", isAuthenticated, createPost);
  router.delete("/:post_id", isAuthenticated, paramPostMiddleware, deletePostEndpoint);
  router.put("/:post_id", isAuthenticated, paramPostMiddleware, editPost);

  router.post("/repost/:post_id", isAuthenticated, paramPostMiddleware, repostPost);

  router.use("/like", getPostLikeRoutes());
  router.use("/comment", getPostCommentRoutes());

  return router;
};

export { getPostRoutes };
