import { DataTypes } from "sequelize";

import { db } from "../database.js";
import User from "./user.model.js";
import Post from "./post.model.js";

const Comment = db.define(
  "comment",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    commented_at: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    edited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    public_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
  },
  {
    tableName: "comment",
  }
);

Comment.belongsTo(User, {
  as: "author",
  foreignKey: "author_id",
});

Comment.belongsTo(Post, {
  as: "post",
  foreignKey: "post_id",
});

export default Comment;
