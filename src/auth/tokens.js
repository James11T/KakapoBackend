import jwt from "jsonwebtoken";
import { getEpoch } from "../utils.js";

import { BadTokenError, NotAuthenticatedError } from "../errors/apierrors.js";

const signToken = (public_id) => {
  /**
   * Generate a token for a user
   * @param {string} public_id The public_id of the user of who the token identifies
   *
   * @returns {Object[]} [An error if one occoured, The generated token]
   */

  const epoch = getEpoch();

  try {
    const token = jwt.sign({ public_id: public_id, created: epoch }, process.env.TOKEN_SECRET, {
      expiresIn: process.env.TOKEN_TTL,
    });

    return [null, token];
  } catch (tokenError) {
    return [tokenError, null];
  }
};

const decodeToken = (token) => {
  /**
   * Decode a JWT token into its original form
   * @param {string} token The JWT token to decode
   *
   * @returns {Object[]} [An error if one occoured, The decoded data]
   */

  try {
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    return [null, decodedToken];
  } catch {
    return [new BadTokenError(), null];
  }
};

const tokenToUser = async (token) => {
  /**
   * Get the user that the token represents
   * @param {string} token The decoded JWT token data
   *
   * @returns {Object[]} [An error if one occoured, The user who the token belongs to]
   */

  const [queryError, tokenUser] = await global.db.table("user").first("*", { public_id: token.public_id });
  if (queryError) {
    return [queryError, null];
  }

  return [null, tokenUser];
};

const decodeAuthHeader = async (authHeader) => {
  /**
   * Extract the JWT token from the auth header, decode it and then return the user is belongs to
   * @param {string} authHeader The authorization header provided
   *
   * @returns {Object} [An error if one occoured, The user who is authenticating]
   */

  // Split the authorization header into the auth type and the token
  const [_, token] = authHeader.split(" ");
  if (!token) {
    return [new NotAuthenticatedError(), null];
  }

  // Decode the token into the data it stores
  const [decodeError, decodedToken] = decodeToken(token);
  if (decodeError) {
    return [decodeError, null];
  }

  // Get the user that the token is linked to
  const [tokenUserError, tokenUser] = await tokenToUser(decodedToken);
  if (tokenUserError) {
    return [tokenUserError, null];
  }

  return [null, tokenUser];
};

export { signToken, decodeToken, tokenToUser, decodeAuthHeader };
