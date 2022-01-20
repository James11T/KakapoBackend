import { DataTypes } from "sequelize";

import { db } from "../database.js";
import User from "./user.model.js";

const Friendship = db.define(
  "friendship",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    user1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

Friendship.belongsTo(User, {
  as: "user1",
  foreignKey: "user1_id",
});

Friendship.belongsTo(User, {
  as: "user2",
  foreignKey: "user2_id",
});

export default Friendship;
