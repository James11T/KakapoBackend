import dotenv from "dotenv";
dotenv.config();

import { hashPassword, checkHash, toPasswordHashString } from "./auth/passwords.js";

let { salt, hash } = await hashPassword("eggcress", "5d04fe7eea0f7cc4a1dbb360711d74e7c43c07dfd8e6b992c2fe4990fa0d1e4b9eb6e3f28659e939bd3e9e66996e38170822dd4c8d445f8335ed5b406ddd6437");
let egg = toPasswordHashString(salt, hash);

