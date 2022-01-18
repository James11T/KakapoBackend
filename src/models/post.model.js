import { DataTypes } from "sequelize";
import User from "./user.model.js";
import { db } from "../database.js";

const Post = db.define(
  "post",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    author: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    media: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    posted_at: {
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
    tableName: "post",
  }
);

export default Post;
