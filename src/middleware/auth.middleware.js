import { decodeAuthHeader } from "../auth/tokens.js";
import { sendError, NotAuthenticatedError, RankTooLowError } from "../errors/apierrors.js";

/**
 * Middleware to fetch the user from the database and append it to the request object
 */
const authenticateRequest = async (req, res, next) => {
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

  req.authenticatedUser = tokenUser;
  return next();
};

/**
 * Middleware to check if the user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (!req.authenticatedUser) {
    return sendError(res, new NotAuthenticatedError());
  }

  return next();
};

/**
 * Returns a middleware function that checks if the user is authenticated
 * If so it checks if they are a high enough rank to access the endpoint
 *
 * @param {number} minimumRank The minimum rank required to use the endpoint
 *
 * @returns {Function} The function to be used as middleware
 */
const isRank = (minimumRank) => {
  return async (req, res, next) => {
    if (!req.authenticatedUser) {
      return sendError(res, new NotAuthenticatedError());
    }

    if (req.authenticatedUser.rank < minimumRank) {
      return sendError(res, new RankTooLowError());
    }

    return next();
  };
};

const rankExceeds = (req, res, next) => {
  if (req.authenticatedUser.rank <= req.user.rank) {
    return sendError(res, new RankTooLowError());
  }

  return next();
};

const rankExceedsOrEqual = (req, res, next) => {
  if (req.authenticatedUser.rank < req.user.rank) {
    return sendError(res, new RankTooLowError());
  }

  return next();
};

export { isRank, authenticateRequest, isAuthenticated, rankExceeds, rankExceedsOrEqual };
