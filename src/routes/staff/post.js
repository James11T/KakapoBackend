import express from "express";

import { GenericError, MissingParametersError, PostNotFoundError, sendError } from "../../errors/apierrors.js";
import { checkRequiredParameters } from "../../utils/validations.js";
import { deletePost } from "../../utils/database.js";
import { paramPostMiddleware } from "../../middleware/data.middleware.js";

const deletePostEndpoint = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["post_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { post_id } = req.body;
  const [getPostError, post] = await global.db.table("post").first("*", { public_id: post_id });
  if (getPostError) {
    return sendError(res, new GenericError());
  }

  if (!post) {
    return sendError(res, new PostNotFoundError());
  }

  const [deleteError] = await deletePost(req.post);
  if (deleteError) {
    return sendError(res, new GenericError());
  }

  return res.send({ success: true });
};

const getStaffPostRoutes = () => {
  const router = express.Router();

  router.delete("/:post_id", paramPostMiddleware, deletePostEndpoint);

  return router;
};

export { getStaffPostRoutes };
