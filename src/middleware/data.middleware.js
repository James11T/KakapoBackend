import { checkRequiredParameters } from "../utils.js";
import {
  sendError,
  MissingParametersError,
  GenericError,
  PostNotFoundError,
  CommentNotFoundError,
} from "../errors/apierrors.js";

/**
 * Dynamic middleware to definitively resolve a table row and append it to the requests
 * Used to prevent repetition in the functions that require data in the body
 *
 * @param {string} table The table to query
 * @param {string} field The body field to check body
 * @param {APIError} error The error to dispatch if the resolve fails
 *
 * @return {function} The middleware to use
 */
const resolvePublicID = (table, field, error) => {
  return async (req, res, next) => {
    const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, [field]);
    if (!hasRequiredParameters) {
      return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
    }

    const fieldValue = req.body[field];

    const [getPostError, result] = await global.db.table(table).first("*", { public_id: fieldValue });
    if (getPostError) {
      return sendError(res, new GenericError());
    }

    if (!result) {
      return sendError(res, new error());
    }

    req[table] = result;

    return next();
  };
};

const resolvePostMiddleware = resolvePublicID("post", "post_id", PostNotFoundError);
const resolveCommentMiddleware = resolvePublicID("comment", "comment_id", CommentNotFoundError);

export { resolvePostMiddleware, resolveCommentMiddleware, resolvePublicID };
