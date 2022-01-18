import { DataTypes } from "sequelize";
import { db } from "../database.js";

const User = db.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    kakapo_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    display_name: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(512),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(257),
      allowNull: false,
    },
    about: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      defaultValue: "",
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    badge: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    joined_at: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    last_online: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    pfp: {
      type: DataTypes.STRING(256),
      allowNull: false,
      defaultValue: "/static/pfp/defaultPFP.png",
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    public_id: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    last_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      validate: {
        isIp: true,
      },
    },
  },
  {
    tableName: "user",
  }
);

export default User;
