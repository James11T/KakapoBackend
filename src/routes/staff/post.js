import express from "express";

import { GenericError, sendError } from "../../errors/apierrors.js";
import { deletePost } from "../../utils/database.js";
import { paramPostMiddleware } from "../../middleware/data.middleware.js";

const deletePostEndpoint = async (req, res) => {
  const success = await deletePost(req.post);
  if (success) {
    return res.send({ success: true });
  } else {
    return sendError(res, new GenericError("Failed to delete like."));
  }
};

const getStaffPostRoutes = () => {
  const router = express.Router();

  router.delete("/:post_id", paramPostMiddleware, deletePostEndpoint);

  return router;
};

export { getStaffPostRoutes };
