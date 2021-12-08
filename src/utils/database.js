import fs from "fs";

import { GenericError } from "../errors/apierrors.js";

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

  const [getFriendshipError, existingFiendResult] = await global.db.table("friendship").first("*", friendshipQuery);
  if (getFriendshipError) {
    return [new GenericError(), null];
  }

  return [null, !!existingFiendResult];
};

/**
 * Delete a post from the database and file storage
 *
 * @param {Post} post The post to delete
 * @param {boolean} [deleteFile=true] Wether to delete the media file
 */
const deletePost = async (post, deleteFile = true) => {
  const [deletePostError, deletePostResult] = await global.db.table("post").delete({ id: post.id });
  if (deletePostError) {
    return [new GenericError(), null];
  }

  if (deleteFile) {
    await fs.promises.unlink(`.${req.post.media}`);
  }

  return [null, deletePostResult];
};

export { orderedFriendQuery, usersAreFriends, deletePost };
