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
  constructor(message, code, errorData = {}) {
    super(message);

    this.name = "APIError";
    this.code = code;
    this.errorData = errorData;
  }
}

class MissingParametersError extends APIError {
  constructor(errorData) {
    super("Missing parameters from request.", "100", errorData);
    this.name = "MissingParametersError";
  }
}

class BadParametersError extends APIError {
  constructor(errorData) {
    super("The supplied parameters were not in expected form.", "101", errorData);
    this.name = "BadParametersError";
  }
}

class PostNotFoundError extends APIError {
  constructor(errorData) {
    super("Post not found.", "102", errorData);
    this.name = "PostNotFoundError";
  }
}

class CommentNotFoundError extends APIError {
  constructor(errorData) {
    super("Comment not found.", "103", errorData);
    this.name = "CommentNotFoundError";
  }
}

class UserNotFoundError extends APIError {
  constructor(errorData) {
    super("User not found.", "104", errorData);
    this.name = "UserNotFoundError";
  }
}

class AlreadyFriendsError extends APIError {
  constructor(errorData) {
    super("You are already friends with this user.", "105", errorData);
    this.name = "AlreadyFriendsError";
  }
}

class NoFriendRequestError extends APIError {
  constructor(errorData) {
    super("You do not have a friend request from this user.", "106", errorData);
    this.name = "NoFriendRequestError";
  }
}

class FileTooLargeError extends APIError {
  constructor(errorData) {
    super("The uploaded file was too large", "107", errorData);
    this.name = "FileTooLargeError";
  }
}

class NotPostOwnerError extends APIError {
  constructor(errorData) {
    super("You do not own this post", "108", errorData);
    this.name = "NotPostOwnerError";
  }
}

class NotCommentOwnerError extends APIError {
  constructor(errorData) {
    super("You do not own this comment", "109", errorData);
    this.name = "NotCommentOwnerError";
  }
}

class AlreadyLikedError extends APIError {
  constructor(errorData) {
    super("You have already liked this post", "110", errorData);
    this.name = "AlreadyLikedError";
  }
}

class NotLikedError extends APIError {
  constructor(errorData) {
    super("You have not liked this post", "111", errorData);
    this.name = "NotLikedError";
  }
}

class CommentNotFoundError extends APIError {
  constructor(errorData) {
    super("Comment not found", "112", errorData);
    this.name = "CommentNotFoundError";
  }
}

class GenericError extends APIError {
  constructor(errorData) {
    super("Server error.", "200", errorData);
    this.name = "GenericError";
  }
}

class DatabaseError extends APIError {
  constructor(errorData) {
    super("An error occourred when accessing the database.", "300", errorData);
    this.name = "DatabaseError";
  }
}

class QueryFailedError extends APIError {
  constructor(errorData) {
    super("An error occourred when performing query.", "301", errorData);
    this.name = "QueryFailedError";
  }
}

class NoEntryError extends APIError {
  constructor(errorData) {
    super(message, "302", errorData);
    this.name = "NoEntryError";
  }
}

class WrongCredentialsError extends APIError {
  constructor(errorData) {
    super("The supplied credentials are incorrect.", "400", errorData);
    this.name = "WrongCredentialsError";
  }
}

class NotAuthenticatedError extends APIError {
  constructor(errorData) {
    super("You must be authenticated to access this endpoint.", "401", errorData);
    this.name = "NotAuthenticatedError";
  }
}

class TokenError extends APIError {
  constructor(errorData) {
    super("Failed to generate access token.", "402", errorData);
    this.name = "TokenError";
  }
}

class BadTokenError extends APIError {
  constructor(errorData) {
    super("The provided authentication token is not valid.", "403", errorData);
    this.name = "BadTokenError";
  }
}

class RankTooLowError extends APIError {
  constructor(errorData) {
    super("You are not authenticated to access this endpoint.", "404", errorData);
    this.name = "RankTooLowError";
  }
}

class IsAuthenticatedError extends APIError {
  constructor(errorData) {
    super("This endpoint requires you to not be authenticated.", "405", errorData);
    this.name = "IsAuthenticatedError";
  }
}

const sendError = (res, error) => {
  /**
   * Dispatch an error to the client 
   * 
   * @param {Object} res The response component in an express request
   * @param {APIError} error The error to ditpatch
   * 
   * @return {Object} The response data
   */
  return res.send({ error: error.code, message: error.message, ...error.errorData });
};

export {
  sendError,
  GenericError,
  MissingParametersError,
  QueryFailedError,
  DatabaseError,
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
  CommentNotFoundError
};
