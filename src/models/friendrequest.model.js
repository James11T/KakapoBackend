import { DataTypes } from "sequelize";
import User from "./user.model.js";
import { db } from "../database.js";

const FriendRequest = db.define(
  "friend_request",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    from: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    to: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    sent_at: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "friend_request",
  }
);

export default FriendRequest;
