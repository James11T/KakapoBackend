import express from "express";

import { GenericError, MissingParametersError, PostNotFoundError, sendError } from "../../errors/apierrors.js";
import { checkRequiredParameters } from "../../utils.js";

const deletePost = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["post_id"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { post_id } = req.body;
  const [getPostError, post] = await global.db.table("post").first("*", { public_id: post_id });
  if (getPostError) {
    return sendError(res, new GenericError());
  }

  if (post) {
    const [deleteError, deleteResult] = await global.db.table("post").delete({ public_id: post.post_id });
    if (deleteError) {
      return sendError(res, new GenericError());
    }

    return res.send({ success: true });
  } else {
    return sendError(res, new PostNotFoundError());
  }
};

const getStaffPostRoutes = () => {
  const router = express.Router();

  router.delete("/post", deletePost);

  return router;
};

export { getStaffPostRoutes };
