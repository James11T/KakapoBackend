import fs from "fs";
import express from "express";
import {
  GenericError,
  MissingParametersError,
  NotPostOwnerError,
  PostNotFoundError,
  sendError,
} from "../errors/apierrors.js";
import { getPostCommentRoutes } from "./post/comment.js";
import { getPostLikeRoutes } from "./post/like.js";
import { generatePublicId, getEpoch } from "../utils/funcs.js";
import { checkRequiredParameters } from "../utils/validations.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { resolvePostMiddleware } from "../middleware/data.middleware.js";

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

const deletePost = async (req, res) => {
  if (req.post.author.public_id !== req.authenticatedUser.public_id) {
    return sendError(res, new NotPostOwnerError());
  }

  const [deletePostError, deletePostResult] = await global.db.table("post").delete({ public_id: req.post.public_id });
  if (deletePostError) {
    return sendError(res, new GenericError());
  }

  fs.unlink(`.${req.post.media}`);

  return res.send({ success: true });
};

const editPost = async (req, res) => {
  if (req.post.author.public_id !== req.authenticatedUser.public_id) {
    return sendError(res, new NotPostOwnerError());
  }

  const [editPostError, editPostResult] = await global.db
    .table("post")
    .edit({ public_id: req.post.public_id }, { edited: true, content: content });
  if (editPostError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const repostPost = async (req, res) => {};

const getPostRoutes = () => {
  const router = express.Router();

  router.get("/", resolvePostMiddleware, getPost);
  router.post("/", isAuthenticated, createPost);
  router.delete("/", isAuthenticated, resolvePostMiddleware, deletePost);
  router.put("/", isAuthenticated, resolvePostMiddleware, editPost);

  router.post("/repost", isAuthenticated, resolvePostMiddleware, repostPost);

  router.use("/like", getPostLikeRoutes());
  router.use("/comment", getPostCommentRoutes());

  return router;
};

export { getPostRoutes };
