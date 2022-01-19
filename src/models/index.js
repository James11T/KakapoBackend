import User from "./user.model.js";
import Post from "./post.model.js";
import Tag from "./tag.model.js";
import Like from "./like.model.js";
import Comment from "./comment.model.js";
import Friendship from "./friendship.model.js";
import FriendRequest from "./friendrequest.model.js";

User.hasMany(FriendRequest);
FriendRequest.belongsTo(User);

export { User, Post, Tag, Like, Comment, Friendship, FriendRequest };
