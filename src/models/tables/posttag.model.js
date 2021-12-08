import Table from "../table.js";
import { NumberField, StringField } from "../fields.js";

const model = (db) =>
  new Table("post_tag", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    tag: new StringField("kakapo_id", { maxLength: 64, sensitivity: 0 }),
    post_id: new StringField("post_id", { sensitivity: 0, reference: { table: "post", field: "id" } }),
  });

export default model;
