/* 
  Error codes follow the structre:
    XYY
  Where X is the error category and YY is the code

  Categories:
    0YY Unknown Error
    1YY Request Error
    2YY Server Error
    3YY Database Error
    4YY Authentication Error
*/

class APIError extends Error {
  constructor(message, code, httpCode, errorData = {}) {
    if (typeof errorData === "string") {
      message = errorData;
      super(message);
    } else {
      super(message);
      this.errorData = errorData;
    }

    this.name = "APIError";
    this.code = code;
    this.httpCode = httpCode;
  }
}

class NotYetImplementedError extends APIError {
  constructor(errorData) {
    super(
      "The requested feature has not yet been fully implemented.",
      "000",
      501,
      errorData
    );
    this.name = NotYetImplementedError;
  }
}

class MissingParametersError extends APIError {
  constructor(errorData) {
    super("Missing parameters from request.", "100", 400, errorData);
    this.name = "MissingParametersError";
  }
}

class BadParametersError extends APIError {
  constructor(errorData) {
    super(
      "The supplied parameters were not in expected form.",
      "101",
      400,
      errorData
    );
    this.name = "BadParametersError";
  }
}

class PostNotFoundError extends APIError {
  constructor(errorData) {
    super("Post not found.", "102", 404, errorData);
    this.name = "PostNotFoundError";
  }
}

class CommentNotFoundError extends APIError {
  constructor(errorData) {
    super("Comment not found.", "103", 404, errorData);
    this.name = "CommentNotFoundError";
  }
}

class UserNotFoundError extends APIError {
  constructor(errorData) {
    super("User not found.", "104", 404, errorData);
    this.name = "UserNotFoundError";
  }
}

class AlreadyFriendsError extends APIError {
  constructor(errorData) {
    super("You are already friends with this user.", "105", 400, errorData);
    this.name = "AlreadyFriendsError";
  }
}

class NoFriendRequestError extends APIError {
  constructor(errorData) {
    super(
      "You do not have a friend request from this user.",
      "106",
      400,
      errorData
    );
    this.name = "NoFriendRequestError";
  }
}

class FileTooLargeError extends APIError {
  constructor(errorData) {
    super("The uploaded file was too large", "107", 413, errorData);
    this.name = "FileTooLargeError";
  }
}

class NotPostOwnerError extends APIError {
  constructor(errorData) {
    super("You do not own this post", "108", 403, errorData);
    this.name = "NotPostOwnerError";
  }
}

class NotCommentOwnerError extends APIError {
  constructor(errorData) {
    super("You do not own this comment", "109", 403, errorData);
    this.name = "NotCommentOwnerError";
  }
}

class AlreadyLikedError extends APIError {
  constructor(errorData) {
    super("You have already liked this post", "110", 400, errorData);
    this.name = "AlreadyLikedError";
  }
}

class NotLikedError extends APIError {
  constructor(errorData) {
    super("You have not liked this post", "111", 400, errorData);
    this.name = "NotLikedError";
  }
}

class PendingFriendRequestError extends APIError {
  constructor(errorData) {
    super(
      "You already have a pending friend request with this user.",
      "112",
      400,
      errorData
    );
    this.name = "PendingFriendRequestError";
  }
}

class SelfFriendRequestError extends APIError {
  constructor(errorData) {
    super(
      "You can not send a friend reuqest to yourself.",
      "113",
      400,
      errorData
    );
    this.name = "SelfFriendRequestError";
  }
}

class KakapoIDReservedError extends APIError {
  constructor(errorData) {
    super("This Kakapo ID has already been reserved", "114", 409, errorData);
    this.name = "KakapoIDReservedError";
  }
}

class GenericError extends APIError {
  constructor(errorData) {
    super("Server error.", "200", 500, errorData);
    this.name = "GenericError";
  }
}

class NoEntryError extends APIError {
  constructor(errorData) {
    super(message, "300", 404, errorData);
    this.name = "NoEntryError";
  }
}

class WrongCredentialsError extends APIError {
  constructor(errorData) {
    super("The supplied credentials are incorrect.", "400", 401, errorData);
    this.name = "WrongCredentialsError";
  }
}

class NotAuthenticatedError extends APIError {
  constructor(errorData) {
    super(
      "You must be authenticated to access this endpoint.",
      "401",
      401,
      errorData
    );
    this.name = "NotAuthenticatedError";
  }
}

class TokenError extends APIError {
  constructor(errorData) {
    super("Failed to generate access token.", "402", 500, errorData);
    this.name = "TokenError";
  }
}

class BadTokenError extends APIError {
  constructor(errorData) {
    super(
      "The provided authentication token is not valid.",
      "403",
      401,
      errorData
    );
    this.name = "BadTokenError";
  }
}

class RankTooLowError extends APIError {
  constructor(errorData) {
    super(
      "You are not authenticated to access this endpoint.",
      "404",
      403,
      errorData
    );
    this.name = "RankTooLowError";
  }
}

class IsAuthenticatedError extends APIError {
  constructor(errorData) {
    super(
      "This endpoint requires you to not be authenticated.",
      "405",
      400,
      errorData
    );
    this.name = "IsAuthenticatedError";
  }
}

/**
 * Dispatch an error to the client
 *
 * @param {Object} res The response component in an express request
 * @param {APIError} error The error to ditpatch
 *
 * @return {Object} The response data
 */
const sendError = (res, error) => {
  return res.status(error.httpCode).send({
    error: error.code,
    message: error.message,
    ...error.errorData,
  });
};

export {
  sendError,
  NotYetImplementedError,
  GenericError,
  MissingParametersError,
  NoEntryError,
  WrongCredentialsError,
  BadParametersError,
  TokenError,
  BadTokenError,
  NotAuthenticatedError,
  RankTooLowError,
  IsAuthenticatedError,
  PostNotFoundError,
  UserNotFoundError,
  AlreadyFriendsError,
  NoFriendRequestError,
  FileTooLargeError,
  NotPostOwnerError,
  NotCommentOwnerError,
  AlreadyLikedError,
  NotLikedError,
  CommentNotFoundError,
  PendingFriendRequestError,
  SelfFriendRequestError,
  KakapoIDReservedError,
};
