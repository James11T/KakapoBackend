import { checkRequiredParameters } from "../utils.js";
import { sendError, MissingParametersError, GenericError, PostNotFoundError } from "../errors/apierrors.js";

const resolvePostMiddleware = async (req, res, next) => {
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

  req.post = post;

  return next();
};

export { resolvePostMiddleware };
