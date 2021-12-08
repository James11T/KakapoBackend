import Table from "../table.js";
import { NumberField, StringField, BooleanField } from "../fields.js";

const model = (db) =>
  new Table("user", db, {
    id: new NumberField("id", { autoIncrement: true, primaryKey: true, sensitivity: -1 }),
    kakapo_id: new StringField("kakapo_id", { maxLength: 64, unique: true, sensitivity: 0 }),
    display_name: new StringField("display_name", { maxLength: 64, sensitivity: 0 }),
    email: new StringField("email", { maxLength: 512, sensitivity: 10 }),
    password: new StringField("password", { maxLength: 257, sensitivity: -1 }),
    about: new StringField("about", { maxLength: 1024, defaultValue: "", sensitivity: 0 }),
    rank: new NumberField("rank", { defaultValue: 0, sensitivity: 20 }),
    badge: new NumberField("badge", { defaultValue: 0, sensitivity: 0 }),
    joined: new NumberField("joined", { sensitivity: 0 }),
    last_online: new NumberField("last_online", { defaultValue: 0, sensitivity: 5 }),
    pfp: new StringField("pfp", {
      maxLength: 256,
      defaultValue: "/static/pfp/defaultPFP.png",
      sensitivity: 0,
    }),
    socials: new NumberField("socials", { nullable: true, defaultValue: null, sensitivity: 0 }),
    muted_until: new NumberField("muted_until", { nullable: true, defaultValue: null, sensitivity: 10 }),
    banned_until: new NumberField("banned_until", { nullable: true, defaultValue: null, sensitivity: 10 }),
    deleted: new BooleanField("deleted", { defaultValue: false, sensitivity: 0 }),
    public_id: new StringField("public_id", { maxLength: 128, sensitivity: 0 }),
  });

export default model;
