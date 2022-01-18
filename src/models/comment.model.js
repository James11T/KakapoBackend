import { DataTypes } from "sequelize";
import User from "./user.model.js";
import Post from "./post.model.js";
import { db } from "../database.js";

const Comment = db.define(
  "comment",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    post: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Post,
        key: "id",
      },
    },
    author: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
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

export default Comment;
