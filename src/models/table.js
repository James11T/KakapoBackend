import { BaseOperator } from "./queryoperators.js";

class Table {
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
    let requiredFields = [];
    Object.keys(this.fields).forEach((field) => {
      if (this.fields[field].isRequiredToCreate()) {
        requiredFields.push(field);
      }
    });

    return requiredFields;
  }

  findPrimaryKey() {
    let primaryKey;
    Object.keys(this.fields).forEach((field) => {
      if (this.fields[field].primaryKey) {
        primaryKey = field;
      }
    });

    return primaryKey;
  }

  findUniqueFields() {
    const fieldKeys = Object.keys(this.fields);
    const uniqueFields = fieldKeys.filter((field) => !!this.fields[field].unique);

    return uniqueFields;
  }

  findReferenceFields() {
    const fieldKeys = Object.keys(this.fields);
    const referenceFields = fieldKeys.filter((field) => !!this.fields[field].reference);

    return referenceFields;
  }

  ///////////////////////////////////////// UTILITIES /////////////////////////////////////////

  fieldsToSelectString(fields) {
    // Turns a list of fields into a string for after SELECT
    // ["a", "b"] -> (`a`, `b`)

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
    // Turns an object whos keys are fields into a string for after WHERE
    // { a: "xyz", b: "abc" } -> (`a`=? OR `b`=?)

    const keys = Object.keys(config);

    let whereString = keys.map((key) => `\`${key}\`=?`).join(` ${operator} `);
    whereString = `(${whereString})`;

    let whereValues = keys.map((key) => config[key]);

    return [whereString, whereValues];
  }

  whereQueryToWhereString(query, operator = "OR") {
    // Turns an object whos keys are fields and values are query values into a WHERE string
    // { a: "xyz", b: "abc" } -> (`a`=? OR `b`=?), ["xyz", "abc"]
    // OR({x: 5}, {y: 2}) -> "WHERE (`x`=? OR `y`=?)", [5, 2]

    if (!query) {
      return ["", []];
    }

    if (query instanceof BaseOperator) {
      const [whereString, whereValues] = query.render();
      return [` WHERE ${whereString}`, whereValues];
    }

    if (Object.keys(query).length === 0) {
      return ["", []];
    }

    const [whereString, whereValues] = this.basicOperatorJoin(query, operator);
    return [` WHERE ${whereString}`, whereValues];
  }

  filter(data, sensitivity) {
    // Given an object that is a representation of the table, remove any fields below a given sensitivity level
    // { id: 5, kakapo_id: "abc" }, 5 -> { kakapo_id: "abc" }
    this.references.forEach((reference) => {
      if (data[reference]) {
        data[reference] = global.db.table(this.fields[reference].reference.table).filter(data[reference], sensitivity);
      }
    });

    const filtered = Object.keys(data)
      .filter((property) => {
        const propertySensitivity = this.fields[property].sensitivity;
        return propertySensitivity <= sensitivity && propertySensitivity >= 0;
      })
      .reduce((filteredObj, property) => {
        filteredObj[property] = data[property];
        return filteredObj;
      }, {});

    return filtered;
  }

  ///////////////////////////////////////// QUERY CONSTRUCTORS /////////////////////////////////////////

  getFieldContructStrings() {
    const fieldKeys = Object.keys(this.fields);
    const fieldConstructors = fieldKeys.map((field) => this.fields[field].renderConstructionString());

    return fieldConstructors;
  }

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

  hasRequiredConstructionFields(config) {
    return this.requiredContructionFields.reduce((prev, curr) => prev && config.includes(curr), true);
  }

  fieldValuesAreValid(fields, config) {
    return fields.reduce((prev, curr) => prev && this.fields[curr].verifyData(config[curr]), true);
  }

  buildInsertQuery(config) {
    const fields = Object.keys(config);

    const fieldNamesString = this.fieldsToSelectString(fields);
    const values = fields.map((field) => config[field]);
    const valuesString = "?".repeat(values.length).split("").join(", ");

    const insertIntoString = `INSERT INTO \`${this.name}\` ${fieldNamesString} VALUES (${valuesString});`;

    return [insertIntoString, values];
  }

  buildSelectQuery(fields, conditional) {
    let fieldNamesString = this.fieldsToSelectString(fields);

    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    const selectString = `SELECT ${fieldNamesString} FROM \`${this.name}\`${whereString};`;
    return [selectString, whereValues];
  }

  buildSelectLimitQuery(fields, conditional, from, count) {
    let [selectString, selectValues] = this.buildSelectQuery(fields, conditional);

    let removeSemiColon = selectString.slice(0, selectString.length - 1);

    return [`${removeSemiColon} LIMIT ?,?;`, [...selectValues, from, count]];
  }

  buildCountQuery(conditional) {
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);
    return [`SELECT COUNT(*) AS \`entry_count\` FROM \`${this.name}\`${whereString};`, whereValues];
  }

  buildSelectAllQuery() {
    return `SELECT * FROM \`${this.name}\`;`;
  }

  buildDeleteQuery(conditional) {
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    return [`DELETE FROM \`${this.name}\` ${whereString};`, whereValues];
  }

  buildUpdateString(conditional, data) {
    let dataString = Object.keys(data).map((key) => `\`${key}\`=?`);
    let [whereString, whereValues] = this.whereQueryToWhereString(conditional);

    return [`UPDATE \`${this.name}\` SET ${dataString}${whereString};`, [...Object.values(data) ,...whereValues]];
  }

  ///////////////////////////////////////// DB INTERFACE /////////////////////////////////////////

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

  async queryAndReturn(queryString, queryValues, returnFirst) {
    // Run a query and return [error, result]

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
    const [queryString, queryValues] = this.buildCountQuery(conditional || {});

    const [err, result] = await this.db.query(queryString, queryValues);
    if (err) {
      return [err, null];
    }

    return [null, result[0].entry_count];
  }

  async all() {
    const queryString = this.buildSelectAllQuery();

    return await this.queryAndReturn(queryString);
  }

  async first(fields, conditional) {
    const [queryString, queryValues] = this.buildSelectQuery(fields, conditional);

    return await this.queryAndReturn(queryString, queryValues, true);
  }

  async limit(fields, conditional, from, count) {
    const [queryString, queryValues] = this.buildSelectLimitQuery(fields, conditional, from, count);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async new(data) {
    const [queryString, queryValues] = this.buildInsertQuery(data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async delete(data) {
    const [queryString, queryValues] = this.buildDeleteQuery(data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async edit(conditional, data) {
    const [queryString, queryValues] = this.buildUpdateString(conditional, data);

    return await this.queryAndReturn(queryString, queryValues);
  }

  async manual(queryString, queryValues) {
    return await this.queryAndReturn(queryString, queryValues);
  }
}

export default Table;
