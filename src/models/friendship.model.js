import { DataTypes } from "sequelize";
import User from "./user.model.js";
import { db } from "../database.js";

const Friendship = db.define(
  "friendship",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    user1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    user2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    friends_since: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "friendship",
  }
);

export default Friendship;
