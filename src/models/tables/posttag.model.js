import Table from "../table.js";
import { NumberField, StringField } from "../fields.js";

const model = (db) =>
  new Table("post_tag", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    tag: new StringField("tag", { maxLength: 64, sensitivity: 0 }),
    post: new NumberField("post", { sensitivity: 0, reference: { table: "post", field: "id" } }),
  });

export default model;
