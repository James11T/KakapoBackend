import { DataTypes } from "sequelize";

import { db } from "../database.js";
import Post from "./post.model.js";

const Tag = db.define(
  "tag",
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

Tag.belongsTo(Post, {
  as: "post",
  foreignKey: "post_id",
});

export default Tag;
