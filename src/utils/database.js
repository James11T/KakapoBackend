import { GenericError } from "/users/james/desktop/programming/kakaponew/kakapobackend/src/errors/apierrors.js";

/**
 *
 * @param {User} user1 A kakapo user
 * @param {User} user2 A different kakapo user
 *
 * @returns {Object} An object with user1 and user2 in order of their IDs
 */
const orderedFriendQuery = (user1, user2) => {
  if (user1.id < user2.id) {
    return { user1: user1.id, user2: user2.id };
  } else {
    return { user1: user2.id, user2: user1.id };
  }
};

/**
 * Check wether 2 users are already friends
 *
 * @param {User} user1 A kakapo user
 * @param {User} user2 A different kakapo user
 *
 * @return {bool} True if the users are friends
 */
const usersAreFriends = async (user1, user2) => {
  let friendshipQuery = orderedFriendQuery(user1, user2);

  const [getFriendshipError, existingFiendResult] = await global.db.table("friendship").first(["*"], friendshipQuery);
  if (getFriendshipError) {
    return [new GenericError(), null];
  }

  return !!existingFiendResult;
};

export { orderedFriendQuery, usersAreFriends };
