import fs from "fs";
import { GenericError } from "../errors/apierrors.js";
import Friendship from "../models/friendship.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

/**
 *
 * @param {User} user1 A kakapo user
 * @param {User} user2 A different kakapo user
 *
 * @returns {Object} An object with user1 and user2 in order of their IDs
 */
const orderedFriendQuery = (user1, user2) => {
  if (user1.id < user2.id) {
    return { user1_id: user1.id, user2_id: user2.id };
  } else {
    return { user1_id: user2.id, user2_id: user1.id };
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

  try {
    const friendship = await Friendship.findOne({
      where: friendshipQuery,
    });
    return [null, !!friendship];
  } catch (error) {
    return [new GenericError("Failed to retrieve findship."), null];
  }
};

/**
 * Delete a post from the database and file storage
 *
 * @param {Post} post The post to delete
 * @param {boolean} [deleteFile=true] Wether to delete the media file
 */
const deletePost = async (post, deleteFile = true) => {
  // SWITCH TO RETURN SUCCESS BOOL
  try {
    await Post.destroy({ where: { id: post.id } });
    if (deleteFile) {
      await fs.promises.unlink(`.${post.media}`);
    }
    return true;
  } catch (error) {
    return false;
  }
};

const isKakapoIDInUse = async (kakapo_id) => {
  try {
    const user = await User.findOne({
      attributes: ["kakapo_id"],
      where: { kakapo_id: kakapo_id },
    });
    return [null, !!user];
  } catch (error) {
    return [error, null];
  }
};

export { orderedFriendQuery, usersAreFriends, deletePost, isKakapoIDInUse };
