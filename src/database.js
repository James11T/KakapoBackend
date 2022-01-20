import Sequelize from "sequelize";

const { DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST } = process.env;

const db = new Sequelize(DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
  define: {
    underscored: true,
  },
});

export { db };
