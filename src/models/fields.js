class BaseField {
  constructor(name, props) {
    const { nullable = false, primaryKey = false, unique = false, defaultValue = undefined, sensitivity = 255, reference } = props;

    this.name = name;
    this.nullable = nullable;
    this.primaryKey = !!primaryKey;
    this.unique = !!unique;
    this.defaultValue = defaultValue;
    this.sensitivity = sensitivity;
    this.reference = reference;

    this.hasDefaultValue = defaultValue !== undefined;
  }

  renderDefault() {
    if (this.defaultValue === null) {
      return "NULL";
    }

    return this.renderData(this.defaultValue);
  }

  renderConstructionString() {
    const typeContructor = this.renderTypeContructor();
    const nullString = this.nullable ? " NULL" : " NOT NULL";
    const defaultString = this.defaultValue !== undefined ? ` DEFAULT ${this.renderDefault()}` : "";

    return `\`${this.name}\` ${typeContructor}${nullString}${defaultString}`;
  }

  isRequiredToCreate() {
    return !(this.nullable || this.hasDefaultValue);
  }
}

class NumberField extends BaseField {
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
