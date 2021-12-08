import Table from "../table.js";
import { NumberField } from "../fields.js";

const model = (db) =>
  new Table("like", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    post: new NumberField("post", { sensitivity: 0, reference: { table: "post", field: "id" } }),
    liker: new NumberField("liker", { sensitivity: 0, reference: { table: "user", field: "id" } }),
    liked_at: new NumberField("liked_at", { sensitivity: 10 }),
  });

export default model;
