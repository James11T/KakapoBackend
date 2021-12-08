import Table from "../table.js";
import { NumberField } from "../fields.js";

const model = (db) =>
  new Table("friend_request", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    from: new NumberField("from", { sensitivity: 10, reference: {table: "user", field: "id"} }),
    to: new NumberField("to", { sensitivity: 10, reference: {table: "user", field: "id"} }),
    sent_at: new NumberField("sent_at", { sensitivity: 10 }),
  });

export default model;