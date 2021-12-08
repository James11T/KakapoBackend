import { decodeAuthHeader } from "../auth/tokens.js";
import { sendError, NotAuthenticatedError, RankTooLowError } from "../errors/apierrors.js";

const authenticateRequest = async (req, res, next) => {
  /**
   * Middleware to fetch the user from the database and append it to the request object
   */

  if (!req.headers.authorization) {
    return next();
  }

  const [decodeError, tokenUser] = await decodeAuthHeader(req.headers.authorization);
  if (decodeError) {
    return next();
  }

  if (!tokenUser) {
    return next();
  }

  req.user = tokenUser;
  return next();
};

const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return sendError(res, new NotAuthenticatedError());
  }

  return next();
};

const isRank = (minimumRank) => {
  /**
   * Returns a middleware function that checks if the user is authenticated
   * If so it checks if they are a high enough rank to access the endpoint
   *
   * @param {number} minimumRank The minimum rank required to use the endpoint
   *
   * @returns {Function} The function to be used as middleware
   */

  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, new NotAuthenticatedError());
    }

    if (req.user.rank < minimumRank) {
      return sendError(res, new RankTooLowError());
    }

    return next();
  };
};

export { isRank, authenticateRequest, isAuthenticated };
