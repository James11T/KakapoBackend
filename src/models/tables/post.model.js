import Table from "../table.js";
import { NumberField, StringField, BooleanField } from "../fields.js";

const model = (db) =>
  new Table("post", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    author: new NumberField("author", { sensitivity: 0, reference: { table: "user", field: "id" } }),
    media: new StringField("media", { maxLength: 256, sensitivity: 0 }),
    content: new StringField("content", { maxLength: 256, sensitivity: 0 }),
    posted_at: new NumberField("posted_at", { sensitivity: 10 }),
    edited: new BooleanField("edited", { defaultValue: false, sensitivity: 0 }),
    public_id: new StringField("public_id", { maxLength: 16, sensitivity: 0 }),
  });

export default model;
