import { checkRequiredParameters } from "../utils.js";
import { sendError, MissingParametersError, GenericError, PostNotFoundError } from "../errors/apierrors.js";

const resolvePostMiddleware = async (req, res, next) => {
  /**
   * Middleware to definitively resolve a post and append it to the requests
   * Used to prevent repetition in the functions tha require a post o be sent
   * in the body
   * 
   * @param {string} req.post_id The public ID of the post to fetch
   */
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
