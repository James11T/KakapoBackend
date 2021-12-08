import Table from "../table.js";
import { NumberField, StringField, BooleanField } from "../fields.js";

const model = (db) =>
  new Table("comment", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    post: new NumberField("post", { sensitivity: 0, reference: { table: "post", field: "id" } }),
    content: new StringField("content", { maxLength: 256, sensitivity: 0 }),
    commented_at: new NumberField("commented_at", { sensitivity: 0 }),
    author: new NumberField("author", { sensitivity: 0, reference: { table: "user", field: "id" } }),
    edited: new BooleanField("edited", { defaultValue: false, sensitivity: 0 }),
    public_id: new StringField("public_id", { maxLength: 16, sensitivity: 0 }),
  });

export default model;
