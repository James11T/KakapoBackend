import { checkRequiredParameters } from "../utils/validations.js";
import {
  sendError,
  MissingParametersError,
  GenericError,
  PostNotFoundError,
  CommentNotFoundError,
  UserNotFoundError,
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
const resolveDatabaseEntry = (table, field, error, column = "public_id") => {
  return async (req, res, next) => {
    const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, [field]);
    if (!hasRequiredParameters) {
      return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
    }

    const fieldValue = req.body[field];
    let conditional = {};
    conditional[column] = fieldValue;

    const [getPostError, result] = await global.db.table(table).first("*", conditional);
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

const resolvePostMiddleware = resolveDatabaseEntry("post", "post_id", PostNotFoundError);
const resolveCommentMiddleware = resolveDatabaseEntry("comment", "comment_id", CommentNotFoundError);
const resolveUserMiddleware = resolveDatabaseEntry("user", "kakapo_id", UserNotFoundError, "kakapo_id");

export { resolvePostMiddleware, resolveCommentMiddleware, resolveUserMiddleware, resolveDatabaseEntry };
