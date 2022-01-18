import { DataTypes } from "sequelize";
import Post from "./post.model.js";
import { db } from "../database.js";

const Tag = db.define(
  "tag",
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
    tag: {
      type: DataTypes.STRING(64),
      allowNull: false,
      validate: {
        len: [1, 64],
      },
    },
  },
  {
    tableName: "tag",
  }
);

export default Tag;
