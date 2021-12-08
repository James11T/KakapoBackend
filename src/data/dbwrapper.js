import mysql from "mysql";

import { promisify } from "util";
import { DatabaseError, GenericError } from "../errors/apierrors.js";

class DBWrapper {
  /**
   * A wrapper for database connection and query
   *
   * @param {Object} config Override configs for database connection
   */

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

  async query(query, data = []) {
    /**
     * Perform a database query while catching errors and escaping SQL
     *
     * @param {string} query The SQL string to execute
     * @param {Object[]} data The data to splice into the SQL query by replacing ?
     *
     * @returns {Object[]} [An error if one occoured, The result of the query]
     */

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
          externalError = new DatabaseError();
          break;
        }
      }

      return [externalError, null];
    }
  }

  async registerTable(table) {
    /**
     * Initialise a table from database
     * Create it if it doesnt exist already
     * 
     * @param {Table} table The table model to be registered
     * 
     * @returns {boolean} Wether the database successfully handled the request
     */

    // Construct the table
    const newTable = table(this);
    this.tables[newTable.name] = newTable;

    const createTableString = newTable.buildCreateTableString();
    const [createTableError, _] = await this.query(createTableString);
    if (createTableError) {
      console.log(createTableError);
      return false;
    }

    return true;
  }

  table(tableName) {
    /**
     * @param {string} tableName The name of a table to be returned
     * 
     * @returns {Table} The table requests, can be undefined
     */
    return this.tables[tableName];
  }
}

export default DBWrapper;
