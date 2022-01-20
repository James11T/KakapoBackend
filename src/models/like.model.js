import { DataTypes } from "sequelize";

import { db } from "../database.js";
import User from "./user.model.js";
import Post from "./post.model.js";

const Like = db.define(
  "like",
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
    liker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    liked_at: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "like",
  }
);

Like.belongsTo(User, {
  as: "liker",
  foreignKey: "liker_id",
});

Like.belongsTo(Post, {
  as: "post",
  foreignKey: "post_id",
});

export default Like;
