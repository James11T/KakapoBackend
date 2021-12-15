import { checkRequiredParameters } from "../utils/validations.js";
import {
  sendError,
  MissingParametersError,
  PostNotFoundError,
  CommentNotFoundError,
  UserNotFoundError,
} from "../errors/apierrors.js";

const resolveParam = async (table, column, value) => {
  let conditional = {};
  conditional[column] = value;

  return await global.db.table(table).first("*", conditional);
};

const resolveRequestData = async (table, column, container, field, error) => {
  return async (req, res, next) => {
    const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req[container], [field]);
    if (!hasRequiredParameters) {
      return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
    }

    let [resolveError, resolveResult] = await resolveParam(table, column, req[container][field]);
    if (resolveError) {
      return sendError(res, resolveError);
    }

    if (!resolveResult) {
      return sendError(res, new error());
    }

    req[table] = resolveResult;

    return next();
  };
};

const resolveBodyData = async (table, column, field, error) => {
  return resolveRequestData(table, column, "body", field, error);
};

const resolveParamData = async (table, column, field, error) => {
  return resolveRequestData(table, column, "params", field, error);
};

const bodyPostMiddleware = resolveBodyData("post", "post_id", "post_id", PostNotFoundError);
const bodyCommentMiddleware = resolveBodyData("comment", "comment_id", "comment_id", CommentNotFoundError);
const bodyUserMiddleware = resolveBodyData("user", "kakapo_id", "kakapo_id", UserNotFoundError);

const paramPostMiddleware = resolveParamData("post", "post_id", "post_id", PostNotFoundError);
const paramCommentMiddleware = resolveParamData("comment", "comment_id", "comment_id", CommentNotFoundError);
const paramUserMiddleware = resolveParamData("user", "kakapo_id", "kakapo_id", UserNotFoundError);

export {
  bodyPostMiddleware,
  bodyCommentMiddleware,
  bodyUserMiddleware,
  paramPostMiddleware,
  paramCommentMiddleware,
  paramUserMiddleware,
};
