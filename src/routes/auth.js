import express from "express";

import {
  sendError,
  MissingParametersError,
  WrongCredentialsError,
  TokenError,
  IsAuthenticatedError,
  GenericError,
  UserNotFoundError,
} from "../errors/apierrors.js";
import { checkHash } from "../auth/passwords.js";
import { signToken } from "../auth/tokens.js";
import { createNewUser } from "../data/datafunctions.js";
import { checkRequiredParameters } from "../utils.js";

const signIn = async (req, res) => {
  /**
   * An endpoint that takes the users kakapo id or email and password in the request body
   * Gets the user from the database if it exists
   * Checks the credentials, if correct provides a JWT token
   */
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["kakapo_id", "password"]);

  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const [userQueryErr, userQueryResult] = await global.db.table("user").first("*", { kakapo_id: req.body.kakapo_id });
  if (userQueryErr) {
    return sendError(res, new GenericError());
  }

  if (!userQueryResult) {
    return sendError(res, new UserNotFoundError());
  }

  const passwordEqual = await checkHash(userQueryResult.password, req.body.password);
  if (!passwordEqual) {
    return sendError(res, new WrongCredentialsError());
  }

  const [tokenError, token] = signToken(userQueryResult.public_id);
  if (tokenError) {
    return sendError(res, new TokenError());
  }

  return res.send({ token: token });
};

const signUp = async (req, res) => {
  if (req.user) {
    return sendError(res, new IsAuthenticatedError());
  }

  const data = req.body;
  const [createError, _] = await createNewUser(data);
  if (createError) {
    return sendError(res, createError);
  }

  return res.send({ message: "Account created successfully." });
};

const getAuthRoutes = () => {
  const router = express.Router();

  router.post("/signin", signIn);
  router.post("/signup", signUp);
  return router;
};

export { getAuthRoutes };
