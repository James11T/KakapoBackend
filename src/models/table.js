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

  /**
   * Get a list of all field that are required for construction
   *
   * @return {string[]} The fields that are required for construction
   */
  getRequiredConstructionFields() {
    return Object.keys(this.fields).filter((field) => this.fields[field].isRequiredToCreate());
  }

  /**
   * Find the first primary key for this table
   *
   * @return {string} The primary key column name
   */
  findPrimaryKey() {
    let primaryKey;
    Object.keys(this.fields).forEach((field) => {
      if (this.fields[field].primaryKey) {
        primaryKey = field;
      }
    });

    return primaryKey;
  }

  /**
   * Find all columns that are defined as being unique
   *
   * @return {string[]} The fields that are defined as being unique
   */
  findUniqueFields() {
    const fieldKeys = Object.keys(this.fields);
    const uniqueFields = fieldKeys.filter((field) => !!this.fields[field].unique);

    return uniqueFields;
  }

  /**
   * Find all columns that are defined as being a foreign keys
   *
   * @return {string[]} The fields that are defined as being foreign keys
   */

  findReferenceFields() {
    const fieldKeys = Object.keys(this.fields);
    const referenceFields = fieldKeys.filter((field) => !!this.fields[field].reference);

    return referenceFields;
  }

  ///////////////////////////////////////// UTILITIES /////////////////////////////////////////

  /**
   * Turns a list of fields into a string for after SELECT
   * E.g.
   * ["a", "b"] -> "(`a`, `b`)"
   *
   * @param {string[]} fields An array or column names
   *
   * @return {string} The SQL string
   */
  fieldsToSelectString(fields) {
    let fieldNamesString;

    if (fields === "*") {
      fieldNamesString = "*";
    } else {
      fieldNamesString = fields.map((fieldName) => `\`${fieldName}\``).join(", ");
      fieldNamesString = `(${fieldNamesString})`;
    }

    return fieldNamesString;
  }

  /**
   * Turns an object whos keys are fields into a string for after WHERE
   * E.g.
   * { a: "xyz", b: "abc" }, "OR" -> ["(`a`=? OR `b`=?)", ["xyz", "abc"]]
   * { a: { operator: "LIKE", value: "xyz", caseInsensitive: true}, b: "abc" } -> ["(LOWER(`a`) LIKE 'xyz' OR `b`=?)", ["xyz", "abc"]]
   *
   * Conditional values can be strings or objects, strings are used with equal operator
   * Objects are expanded with custom operators, values and case insensitivity
   * { operator?: "LIKE", value: "xyz", caseInsensitive?: true}
   *
   *
   * @param {Object} conditional An object whos keys are column names
   * @param {string} operator The operator to compare join the query
   *
   * @return {*[string, *[]]} The operators joined with the values extracted into a seperate list
   */
  parseConditionals(conditional, operator) {
    const keys = Object.keys(conditional);

    let whereValues = [];
    let whereFragments = keys.map((key) => {
      let keyData = conditional[key];
      if (typeof keyData == "object") {
        if (!keyData.operator) {
          keyData.operator = "=";
        }

        if (keyData.caseInsensitive) {
          whereValues.push(keyData.value.toLowerCase());
          return `LOWER(\`${key}\`) ${keyData.operator} ?`;
        }

        whereValues.push(keyData.value);
        return `\`${key}\` ${keyData.operator} ?`;
      } else {
        whereValues.push(keyData);
        return `\`${key}\` = ?`;
      }
    });

    let whereString = whereFragments.join(` ${operator} `);

    return [whereString, whereValues];
  }

  /**
   * Turns an object whos keys are fields and values are query values into a WHERE string
   * E.g.
   * { a: "xyz", b: "abc" } -> "WHERE (`a`=? OR `b`=?)", ["xyz", "abc"]
   *
   * @return {*[]} The operators joined with the values extracted into a seperate list
   */
  whereQueryToWhereString(conditional, operator = "AND") {
    if (!conditional) {
      return ["", []];
    }

    if (Object.keys(conditional).length === 0) {
      return ["", []];
    }

    const [whereString, whereValues] = this.parseConditionals(conditional, operator);
    return [` WHERE ${whereString}`, whereValues];
  }

  /**
   * Given an object that is a representation of the table, remove any fields below a given sensitivity level
   *
   * @param {Object} data The "row" in the table
   * @param {number} sensitivity The minimum sensitivity to filter by
   *
   * @returns {Object} A filtered version of data
   */
  filter(data, sensitivity) {
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

  /**
   * Get the construction strings for each column
   *
   * @returns {string[]} The construction strings for each column
   */
  getFieldContructStrings() {
    return Object.keys(this.fields).map((field) => this.fields[field].renderConstructionString());
  }

  /**
   * Build a CREATE TABLE string for the table
   * Includes primary key, unique and reference constraints
   *
   * @returns {string} The create table string
   */
  buildCreateTableString() {
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

  /**
   * Check all required construction columns are present in the given object
   *
   * @param {Object} config The configuration object of a new row
   *
   * @returns {boolean} True if all required construction columns are present
   */
  hasRequiredConstructionFields(config) {
    return this.requiredContructionFields.reduce((prev, curr) => prev && config.includes(curr), true);
  }

  /**
   * Build an SQL string to insert a new row into the table
   *
   * @param {Object} config The data for the new row
   *
   * @returns {*[string, *[]]} The SQL insert string and its values
   */
  buildInsertQuery(config) {
    const fields = Object.keys(config);

    const fieldNamesString = this.fieldsToSelectString(fields);
    const values = fields.map((field) => config[field]);
    const valuesString = "?".repeat(values.length).split("").join(", ");

    const insertIntoString = `INSERT INTO \`${this.name}\` ${fieldNamesString} VALUES (${valuesString});`;

    return [insertIntoString, values];
  }

  /**
   * Build an SQL string to select a rows from the table
   *
   * @param {Object || string} fields The fields to select from the table, can be *.
   * @param {Object} conditional An object representing the WHERE part of the query
   *
   * @returns {*[string, *[]]} The SQL select string and its values
   */
  buildSelectQuery(fields, conditional, operator) {
    let fieldNamesString = this.fieldsToSelectString(fields);

    let [whereString, whereValues] = this.whereQueryToWhereString(conditional, operator);

    const selectString = `SELECT ${fieldNamesString} FROM \`${this.name}\`${whereString};`;
    return [selectString, whereValues];
  }

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
  buildSelectLimitQuery(fields, conditional, from, count) {
    let [selectString, selectValues] = this.buildSelectQuery(fields, conditional);

    let removeSemiColon = selectString.slice(0, selectString.length - 1);

    return [`${removeSemiColon} LIMIT ?,?;`, [...selectValues, from, count]];
  }

  /**
   * Build an SQL string to select a rows from the table within a given range
   *
   * @param {Object} conditional An object representing the WHERE part of the query
   *
   * @returns {string} The SQL count string
   */
  buildCountQuery(conditional, operator) {
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional, operator);
    return [`SELECT COUNT(*) AS \`entry_count\` FROM \`${this.name}\`${whereString};`, whereValues];
  }

  /**
   * Build an SQL string to select every row in the table
   *
   * @returns {string} The select all SQL query string
   */
  buildSelectAllQuery() {
    return `SELECT * FROM \`${this.name}\`;`;
  }

  /**
   * Build an SQL string to delete a row from the table
   *
   * @param {Object} conditional An object representing the WHERE part of the query
   *
   * @returns {*[string, *[]]} The SQL delete string and its values
   */
  buildDeleteQuery(conditional) {
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    return [`DELETE FROM \`${this.name}\` ${whereString};`, whereValues];
  }

  /**
   * Build an SQL string to update a row in the table
   *
   * @param {Object} conditional An object representing the WHERE part of the query
   * @param {Object} data An object representing the data to update in the row
   *
   * @returns {*[string, *[]]} The select string and its values
   */
  buildUpdateString(conditional, data) {
    let dataString = Object.keys(data).map((key) => `\`${key}\`=?`);
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    return [`UPDATE \`${this.name}\` SET ${dataString}${whereString};`, [...Object.values(data), ...whereValues]];
  }

  ///////////////////////////////////////// DB INTERFACE /////////////////////////////////////////

  /**
   * Resolve all foreign keys that are present in a a set of rows
   *
   * @param {Object[]} rows An array of rows to resolve
   */
  async resolveReferences(rows = []) {
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

  /**
   * Run an SQL query a return an error, is present, and the result
   *
   * @param {string} queryString The SQL query string
   * @param {*[]} queryValues The values for the given query string
   * @param {boolean} [returnFirst = false] If true, return the first result and discard other results
   */
  async queryAndReturn(queryString, queryValues, returnFirst = false) {
    console.log("QUERY: ", queryString, queryValues);
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

  /**
   * Count all occurrences in the table that fit the conitional
   *
   * @param {Object} conditional An object representing the WHERE part of the query
   *
   * @return {*[APIError, number]} An error, if errored, and the result
   */
  async count(conditional, operator) {
    const [queryString, queryValues] = this.buildCountQuery(conditional || {}, operator);

    const [err, result] = await this.db.query(queryString, queryValues);
    if (err) {
      return [err, null];
    }

    return [null, result[0].entry_count];
  }

  /**
   * Get all rows in the table
   *
   * @return {*[APIError, Object[]]} An error, if errored, and the rows
   */
  async all(fields, conditional, operator = "AND") {
    const [queryString, queryValues] = this.buildSelectQuery(fields || "*", conditional || {});

    return await this.queryAndReturn(queryString, queryValues, false);
  }

  /**
   * Get the first row that meets the conditional
   *
   * @return {*[APIError, Object[]]} An error, if errored, and the first row
   */
  async first(fields, conditional, operator = "AND") {
    const [queryString, queryValues] = this.buildSelectQuery(fields, conditional, operator);

    return await this.queryAndReturn(queryString, queryValues, true);
  }

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
  async limit(fields, conditional, from, count) {
    const [queryString, queryValues] = this.buildSelectLimitQuery(fields, conditional, from, count);

    return await this.queryAndReturn(queryString, queryValues);
  }

  /**
   * Attempt to create a new row in the table with the given data
   *
   * @param {Object} data The data to create the row with where keys are column names
   *
   * @return {*[APIError, Object[]]} An error, if errored, and the rows
   */
  async new(data) {
    const [queryString, queryValues] = this.buildInsertQuery(data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  /**
   * Attempt to delete the rows from the table that meet the conditional
   *
   * @param {Object} conditional An object representing the WHERE part of the query
   *
   * @return {*[APIError, Object[]]} An error, if errored, and the rows
   */
  async delete(conditional) {
    const [queryString, queryValues] = this.buildDeleteQuery(conditional);

    return await this.queryAndReturn(queryString, queryValues);
  }

  /**
   * Attempt to update a row from the table that meets the conditional
   *
   * @param {Object} conditional An object representing the WHERE part of the query
   * @param {Object} data An object representing the data to update in the row
   *
   * @return {*[APIError, Object[]]} An error, if errored, and the rows
   */
  async edit(conditional, data) {
    const [queryString, queryValues] = this.buildUpdateString(conditional, data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  /**
   * Manually run an SQL query string
   * Not reccomended to be used
   *
   * @param {Object} queryString The SQL query string to execute
   * @param {Object} queryValues An array of values that are used in the query string
   *
   * @return {*[APIError, Object[]]} An error, if errored, and the rows
   */
  async manual(queryString, queryValues) {
    return await this.queryAndReturn(queryString, queryValues);
  }
}

export default Table;
