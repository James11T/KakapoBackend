class BaseOperator {
  constructor(values, operator) {
    this.values = values;
    this.operator = operator;
  }

  expand(value) {
    if (value instanceof BaseOperator) {
      return value.render();
    } else {
      const key = Object.keys(value)[0];
      return [`\`${key}\`=?`, [value[key]]];
    }
  }

  render() {
    let valueStrings = [];
    let valueValues = [];

    this.values.forEach((value) => {
      const [expandedString, expandedValues] = this.expand(value);
      valueStrings.push(expandedString);
      valueValues = [...valueValues, ...expandedValues];
    });

    const valueString = valueStrings.join(` ${this.operator} `);

    return [`(${valueString})`, valueValues];
  }
}

class OR extends BaseOperator {
  constructor(...values) {
    super(values, "OR");
  }
}

class AND extends BaseOperator {
  constructor(...values) {
    super(values, "AND");
  }
}

export { BaseOperator, AND, OR };
