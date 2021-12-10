import mysql from "mysql";

import { promisify } from "util";
import { DatabaseError, GenericError } from "../errors/apierrors.js";

/**
 * A wrapper for database connection and query
 *
 * @param {Object} config Override configs for database connection
 */
class DBWrapper {
  constructor(config) {
    let dbConfig = {
      connectionLimit: process.env.DB_POOL_LIMIT,
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE_NAME,
    };

    this.pool = mysql.createPool({ ...dbConfig, ...config });
    this.pool.query = promisify(this.pool.query);

    this.tables = {};
  }

  /**
   * Perform a database query while catching errors and escaping SQL
   *
   * @param {string} query The SQL string to execute
   * @param {Object[]} data The data to splice into the SQL query by replacing ?
   *
   * @returns {Object[]} [An error if one occoured, The result of the query]
   */
  async query(query, data = []) {
    try {
      const res = await this.pool.query(query, data);

      return [null, res];
    } catch (err) {
      // Catch SQL error and convert into API error
      console.warn(err);

      let externalError;
      switch (err.errno) {
        case 1062: {
          // Duplicate entry
          externalError = new GenericError({ message: "Database conflict" });
          break;
        }
        case 1048: {
          // Bad NULL
          externalError = new GenericError({ message: "A non-nullable value was null" });
          break;
        }
        default: {
          // Not accounted for
          externalError = new GenericError();
          break;
        }
      }

      return [externalError, null];
    }
  }

  /**
   *
   * @param {Table[]} tables An array of table models to contruct and add to the database
   *
   * @returns {boolean} True if all tables were successfully initialised
   */
  async registerTables(tables) {
    let success = true;

    this.pool.getConnection((err, connection) => {
      if (err) {
        success = false;
        return;
      }

      tables.forEach((table) => {
        const newTable = table(this);
        this.tables[newTable.name] = newTable;

        const createTableString = newTable.buildCreateTableString();
        try {
          connection.query(createTableString);
        } catch {
          success = false;
        }
      });

      connection.release();
    });

    return success;
  }

  /**
   * @param {string} tableName The name of a table to be returned
   *
   * @returns {Table} The table requests, can be undefined
   */
  table(tableName) {
    return this.tables[tableName];
  }
}

export default DBWrapper;
