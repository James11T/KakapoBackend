import { DataTypes } from "sequelize";
import User from "./user.model.js";
import Post from "./post.model.js";
import { db } from "../database.js";

const Like = db.define(
  "like",
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
    liker: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
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

export default Like;
