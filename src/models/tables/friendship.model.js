import Table from "../table.js";
import { NumberField } from "../fields.js";

const model = (db) =>
  new Table("friendship", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    user1: new NumberField("user1", { sensitivity: 10, reference: { table: "user", field: "id" } }),
    user2: new NumberField("user2", { sensitivity: 10, reference: { table: "user", field: "id" } }),
    friends_since: new NumberField("friends_since", { sensitivity: 10 }),
  });

export default model;
