class BaseField {
  /**
   * Used to represent a column in a table
   *
   * @param {string} name The name of the column in the database
   * @param {Object} props The properties of the column in the database
   */
  constructor(name, props) {
    const {
      nullable = false,
      primaryKey = false,
      unique = false,
      defaultValue = undefined,
      sensitivity = 255,
      reference,
    } = props;

    this.name = name;
    this.nullable = nullable;
    this.primaryKey = !!primaryKey;
    this.unique = !!unique;
    this.defaultValue = defaultValue;
    this.sensitivity = sensitivity;
    this.reference = reference;

    this.hasDefaultValue = defaultValue !== undefined;
  }

  /**
   * Render the default value of a column
   *
   * E.g.
   * VARCHAR(32)
   * INT
   * BOOL
   * NULL
   *
   * @return {string} The default value
   */
  renderDefault() {
    if (this.defaultValue === null) {
      return "NULL";
    }

    return this.renderData(this.defaultValue);
  }

  /**
   * Render the section of an SQL query that creates the column in a table
   * E.g.
   * `ID` INT NOT NULL DEFAULT 1
   * `name` VARCHAR(32) NOT NULL DEFAULT "Egg";
   *
   * @returns {string} The SQL section
   */
  renderConstructionString() {
    const typeContructor = this.renderTypeContructor();
    const nullString = this.nullable ? " NULL" : " NOT NULL";
    const defaultString = this.defaultValue !== undefined ? ` DEFAULT ${this.renderDefault()}` : "";

    return `\`${this.name}\` ${typeContructor}${nullString}${defaultString}`;
  }

  /**
   * Return wether the column must be defined upon construction
   *
   * @return {boolean} True if the column must be defined upon construction
   */
  isRequiredToCreate() {
    return !(this.nullable || this.hasDefaultValue);
  }
}

class NumberField extends BaseField {
  /**
   * Represents an INT column
   */
  constructor(name, props) {
    const { autoIncrement = false, ...otherProps } = props;
    super(name, otherProps);

    this.autoIncrement = !!autoIncrement;
  }

  renderData(data) {
    return data.toString();
  }

  renderTypeContructor() {
    const autoIncrement = this.autoIncrement ? " AUTO_INCREMENT" : "";

    return `INT${autoIncrement}`;
  }

  verifyData(data) {
    return typeof data === "number";
  }

  isRequiredToCreate() {
    return !(this.nullable || this.hasDefaultValue) && !this.autoIncrement;
  }
}

class StringField extends BaseField {
  /**
   * Represents a VARCHAR column
   */
  constructor(name, props) {
    const { maxLength = 256, charSet = "utf8mb4 COLLATE utf8mb4_bin", ...otherProps } = props;
    super(name, otherProps);

    this.maxLength = maxLength;
    this.charSet = charSet;
  }

  renderData(data) {
    return `'${data}'`;
  }

  renderTypeContructor() {
    const charSet = this.charSet ? ` CHARACTER SET ${this.charSet}` : "";

    return `VARCHAR(${this.maxLength})${charSet}`;
  }

  verifyData(data) {
    return typeof data === "string" && data.length <= this.maxLength;
  }
}

class BooleanField extends BaseField {
  /**
   * Represents a BOOL or TINYINT column
   */
  constructor(name, props) {
    const { ...otherProps } = props;
    super(name, otherProps);
  }

  renderData(data) {
    return data ? "1" : "0";
  }

  renderTypeContructor() {
    return `BOOLEAN`;
  }

  verifyData(data) {
    return data === true || data === false;
  }
}

export { NumberField, StringField, BooleanField };
