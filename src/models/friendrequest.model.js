import { DataTypes } from "sequelize";

import { db } from "../database.js";
import User from "./user.model.js";

const FriendRequest = db.define(
  "friend_request",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    from_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    to_id: {
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

FriendRequest.belongsTo(User, {
  as: "from",
  foreignKey: "from_id",
});

FriendRequest.belongsTo(User, {
  as: "to",
  foreignKey: "to_id",
});

export default FriendRequest;
