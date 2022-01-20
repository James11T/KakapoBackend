import { DataTypes } from "sequelize";

import { db } from "../database.js";
import User from "./user.model.js";

const Post = db.define(
  "post",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

Post.belongsTo(User, {
  as: "author",
  foreignKey: "author_id",
});

export default Post;
