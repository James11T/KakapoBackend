class Table {
  /**
   * Represents a database table and its columns
   *
   * @param {string} name The name of the table in the database
   * @param {DBWrapper} db The database interface
   * @param {BaseField[]} fields The fields of the table
   */

  constructor(name, db, fields) {
    this.name = name;
    this.db = db;
    this.fields = fields;
    this.primaryKey = this.findPrimaryKey();
    this.unqiueFields = this.findUniqueFields();
    this.requiredContructionFields = this.getRequiredConstructionFields();
    this.references = this.findReferenceFields();
  }

  getRequiredConstructionFields() {
    /**
     * Get a list of all field that are required for construction
     *
     * @return {string[]} The fields that are required for construction
     */

    return Object.keys(this.fields).filter((field) => this.fields[field].isRequiredToCreate());
  }

  findPrimaryKey() {
    /**
     * Find the first primary key for this table
     *
     * @return {string} The primary key column name
     */

    let primaryKey;
    Object.keys(this.fields).forEach((field) => {
      if (this.fields[field].primaryKey) {
        primaryKey = field;
      }
    });

    return primaryKey;
  }

  findUniqueFields() {
    /**
     * Find all columns that are defined as being unique
     *
     * @return {string[]} The fields that are defined as being unique
     */
    const fieldKeys = Object.keys(this.fields);
    const uniqueFields = fieldKeys.filter((field) => !!this.fields[field].unique);

    return uniqueFields;
  }

  findReferenceFields() {
    /**
     * Find all columns that are defined as being a foreign keys
     *
     * @return {string[]} The fields that are defined as being foreign keys
     */

    const fieldKeys = Object.keys(this.fields);
    const referenceFields = fieldKeys.filter((field) => !!this.fields[field].reference);

    return referenceFields;
  }

  ///////////////////////////////////////// UTILITIES /////////////////////////////////////////

  fieldsToSelectString(fields) {
    /**
     * Turns a list of fields into a string for after SELECT
     * E.g.
     * ["a", "b"] -> "(`a`, `b`)"
     *
     * @return {string} The SQL string
     */

    let fieldNamesString;

    if (fields === "*") {
      fieldNamesString = "*";
    } else {
      fieldNamesString = fields.map((fieldName) => `\`${fieldName}\``).join(", ");
      fieldNamesString = `(${fieldNamesString})`;
    }

    return fieldNamesString;
  }

  basicOperatorJoin(config, operator) {
    /**
     * Turns an object whos keys are fields into a string for after WHERE
     * E.g.
     * { a: "xyz", b: "abc" } -> ["(`a`=? OR `b`=?)", ["xyz", "abc"]]
     *
     * @return {*[string, *[]]} The operators joined with the values extracted into a seperate list
     */

    const keys = Object.keys(config);

    let whereString = keys.map((key) => `\`${key}\`=?`).join(` ${operator} `);
    whereString = `(${whereString})`;

    let whereValues = keys.map((key) => config[key]);

    return [whereString, whereValues];
  }

  whereQueryToWhereString(query, operator = "OR") {
    /**
     * Turns an object whos keys are fields and values are query values into a WHERE string
     * E.g.
     * { a: "xyz", b: "abc" } -> "WHERE (`a`=? OR `b`=?)", ["xyz", "abc"]
     *
     * @return {*[string, *[]]} The operators joined with the values extracted into a seperate list
     */

    if (!query) {
      return ["", []];
    }

    if (Object.keys(query).length === 0) {
      return ["", []];
    }

    const [whereString, whereValues] = this.basicOperatorJoin(query, operator);
    return [` WHERE ${whereString}`, whereValues];
  }

  filter(data, sensitivity) {
    /**
     * Given an object that is a representation of the table, remove any fields below a given sensitivity level
     *
     * @param {Object} data The "row" in the table
     * @param {number} sensitivity The minimum sensitivity to filter by
     *
     * @returns {Object} A filtered version of data
     */

    this.references.forEach((reference) => {
      // Filter any references present
      if (data[reference]) {
        data[reference] = global.db.table(this.fields[reference].reference.table).filter(data[reference], sensitivity);
      }
    });

    const filtered = Object.keys(data)
      .filter((property) => {
        // Remove any fields that are too sensitive
        const propertySensitivity = this.fields[property].sensitivity;
        return propertySensitivity <= sensitivity && propertySensitivity >= 0;
      })
      .reduce((filteredObj, property) => {
        // Compact back into an object
        filteredObj[property] = data[property];
        return filteredObj;
      }, {});

    return filtered;
  }

  ///////////////////////////////////////// QUERY CONSTRUCTORS /////////////////////////////////////////

  getFieldContructStrings() {
    /**
     * Get the construction strings for each column
     *
     * @returns {string[]} The construction strings for each column
     */
    return Object.keys(this.fields).map((field) => this.fields[field].renderConstructionString());
  }

  buildCreateTableString() {
    /**
     * Build a CREATE TABLE string for the table
     * Includes primary key, unique and reference constraints
     *
     * @returns {string} The create table string
     */

    const primaryKey = `PRIMARY KEY (\`${this.primaryKey}\`)`;
    const fieldConstructors = this.getFieldContructStrings();
    const unqiueFields = this.unqiueFields.map((field) => `UNIQUE (\`${field}\`)`);
    const referencesStrings = this.references.map((field) => {
      let referenceData = this.fields[field].reference;
      return `FOREIGN KEY (\`${field}\`) REFERENCES ${referenceData.table}(\`${referenceData.field}\`)`;
    });

    const constructionString = [...fieldConstructors, primaryKey, ...unqiueFields, ...referencesStrings].join(",");
    const createTableString = `CREATE TABLE IF NOT EXISTS \`${this.name}\` (${constructionString});`;

    return createTableString;
  }

  hasRequiredConstructionFields(config) {
    /**
     * Check all required construction columns are present in the given object
     *
     * @param {Object} config The configuration object of a new row
     *
     * @returns {boolean} True if all required construction columns are present
     */

    return this.requiredContructionFields.reduce((prev, curr) => prev && config.includes(curr), true);
  }

  buildInsertQuery(config) {
    /**
     * Build an SQL string to insert a new row into the table
     *
     * @param {Object} config The data for the new row
     *
     * @returns {*[string, *[]]} The SQL insert string and its values
     */

    const fields = Object.keys(config);

    const fieldNamesString = this.fieldsToSelectString(fields);
    const values = fields.map((field) => config[field]);
    const valuesString = "?".repeat(values.length).split("").join(", ");

    const insertIntoString = `INSERT INTO \`${this.name}\` ${fieldNamesString} VALUES (${valuesString});`;

    return [insertIntoString, values];
  }

  buildSelectQuery(fields, conditional) {
    /**
     * Build an SQL string to select a rows from the table
     *
     * @param {Object || string} fields The fields to select from the table, can be *.
     * @param {Object} conditional An object representing the WHERE part of the query
     *
     * @returns {*[string, *[]]} The SQL select string and its values
     */

    let fieldNamesString = this.fieldsToSelectString(fields);

    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    const selectString = `SELECT ${fieldNamesString} FROM \`${this.name}\`${whereString};`;
    return [selectString, whereValues];
  }

  buildSelectLimitQuery(fields, conditional, from, count) {
    /**
     * Build an SQL string to select a rows from the table within a given range
     *
     * @param {Object || string} fields The fields to select from the table, can be *
     * @param {Object} conditional An object representing the WHERE part of the query
     * @param {number} from The Nth row to start from
     * @param {number} count The maximum ammount of rows to get from the table
     *
     * @returns {*[string, *[]]} The SQL limit select string and its values
     */

    let [selectString, selectValues] = this.buildSelectQuery(fields, conditional);

    let removeSemiColon = selectString.slice(0, selectString.length - 1);

    return [`${removeSemiColon} LIMIT ?,?;`, [...selectValues, from, count]];
  }

  buildCountQuery(conditional) {
    /**
     * Build an SQL string to select a rows from the table within a given range
     *
     * @param {Object} conditional An object representing the WHERE part of the query
     *
     * @returns {string} The SQL count string
     */

    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);
    return [`SELECT COUNT(*) AS \`entry_count\` FROM \`${this.name}\`${whereString};`, whereValues];
  }

  buildSelectAllQuery() {
    /**
     * Build an SQL string to select every row in the table
     *
     * @returns {string} The select all SQL query string
     */

    return `SELECT * FROM \`${this.name}\`;`;
  }

  buildDeleteQuery(conditional) {
    /**
     * Build an SQL string to delete a row from the table
     *
     * @param {Object} conditional An object representing the WHERE part of the query
     *
     * @returns {*[string, *[]]} The SQL delete string and its values
     */

    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    return [`DELETE FROM \`${this.name}\` ${whereString};`, whereValues];
  }

  buildUpdateString(conditional, data) {
    /**
     * Build an SQL string to update a row in the table
     *
     * @param {Object} conditional An object representing the WHERE part of the query
     * @param {Object} data An object representing the data to update in the row
     *
     * @returns {*[string, *[]]} The select string and its values
     */

    let dataString = Object.keys(data).map((key) => `\`${key}\`=?`);
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    return [`UPDATE \`${this.name}\` SET ${dataString}${whereString};`, [...Object.values(data), ...whereValues]];
  }

  ///////////////////////////////////////// DB INTERFACE /////////////////////////////////////////

  async resolveReferences(rows = []) {
    /**
     * Resolve all foreign keys that are present in a a set of rows
     *
     * @param {Object[]} rows An array of rows to resolve
     */

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      let row = rows[rowIndex];

      for (let referenceIndex = 0; referenceIndex < this.references.length; referenceIndex++) {
        let field = this.references[referenceIndex];

        // Loop all rows and resolve the reference
        if (row[field]) {
          // Build reference conditional
          let fieldData = this.fields[field];

          let conditional = {};
          conditional[fieldData.reference.field] = row[field];

          const [getRefError, refResult] = await global.db.table(fieldData.reference.table).first("*", conditional);
          if (getRefError) {
            rows[rowIndex][field] = null;
          }

          rows[rowIndex][field] = refResult;
        }
      }
    }

    return rows;
  }

  async queryAndReturn(queryString, queryValues, returnFirst = false) {
    /**
     * Run an SQL query a return an error, is present, and the result
     *
     * @param {string} queryString The SQL query string
     * @param {*[]} queryValues The values for the given query string
     * @param {boolean} [returnFirst = false] If true, return the first result and discard other results
     */

    let [err, result] = await this.db.query(queryString, queryValues);
    if (err) {
      return [err, null];
    }

    result = await this.resolveReferences(result);

    if (returnFirst) {
      return [null, result[0]];
    }
    return [null, result];
  }

  async count(conditional) {
    /**
     * Count all occurrences in the table that fit the conitional
     *
     * @param {Object} conditional An object representing the WHERE part of the query
     *
     * @return {*[APIError, number]} An error, if errored, and the result
     */

    const [queryString, queryValues] = this.buildCountQuery(conditional || {});

    const [err, result] = await this.db.query(queryString, queryValues);
    if (err) {
      return [err, null];
    }

    return [null, result[0].entry_count];
  }

  async all() {
    /**
     * Get all rows in the table
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the rows
     */

    const queryString = this.buildSelectAllQuery();

    return await this.queryAndReturn(queryString);
  }

  async first(fields, conditional) {
    /**
     * Get the first row that meets the conditional
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the first row
     */

    const [queryString, queryValues] = this.buildSelectQuery(fields, conditional);

    return await this.queryAndReturn(queryString, queryValues, true);
  }

  async limit(fields, conditional, from, count) {
    /**
     * Get all rows in the table that are within the given range
     *
     * @param {string[]} fields The fields to select from the table
     * @param {Object} conditional An object representing the WHERE part of the query
     * @param {number} from The Nth row to start from
     * @param {number} count The maximum ammount of rows to get from the table
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the rows
     */

    const [queryString, queryValues] = this.buildSelectLimitQuery(fields, conditional, from, count);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async new(data) {
    /**
     * Attempt to create a new row in the table with the given data
     *
     * @param {Object} data The data to create the row with where keys are column names
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the rows
     */

    const [queryString, queryValues] = this.buildInsertQuery(data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async delete(conditional) {
    /**
     * Attempt to delete the rows from the table that meet the conditional
     *
     * @param {Object} conditional An object representing the WHERE part of the query
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the rows
     */

    const [queryString, queryValues] = this.buildDeleteQuery(conditional);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async edit(conditional, data) {
    /**
     * Attempt to update a row from the table that meets the conditional
     *
     * @param {Object} conditional An object representing the WHERE part of the query
     * @param {Object} data An object representing the data to update in the row
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the rows
     */

    const [queryString, queryValues] = this.buildUpdateString(conditional, data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async manual(queryString, queryValues) {
    /**
     * Manually run an SQL query string
     * Not reccomended to be used
     *
     * @param {Object} queryString The SQL query string to execute
     * @param {Object} queryValues An array of values that are used in the query string
     *
     * @return {*[APIError, Object[]]} An error, if errored, and the rows
     */

    return await this.queryAndReturn(queryString, queryValues);
  }
}

export default Table;
