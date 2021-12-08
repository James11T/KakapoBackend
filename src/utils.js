import fs from "fs";
import { randomUUID } from "crypto";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getEpoch = () => {
  /**
   * Get the ammount of secconds since 01/01/1970
   */

  const now = new Date().getTime();

  // Convert from ms to s
  const epoch = Math.floor(now / 1000);

  return epoch;
};

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const checkRequiredParameters = (obj, requiredParameters) => {
  // Given any Object check if it has all fields defined in requiredParameters array

  const missingParameters = requiredParameters.filter((requiredParameter) => !obj[requiredParameter], true);

  return [missingParameters.length === 0, missingParameters];
};

const checkEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
};

const checkKakapoId = (kakapoId) => {
  return kakapoId.length === clamp(kakapoId.length, 2, 32) && !kakapoId.includes(" ");
};

const checkDisplayName = (displayName) => {
  return displayName.length === clamp(kakapoId.length, 2, 32);
};

const checkPassword = (password) => {
  return password.length === clamp(password.length, 8, 256);
};

const getUUID = () => {
  return randomUUID();
};

const randomArrayEntry = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const PUBLIC_ID_CHARACTERS = "abcdefghijklmnopqrstuvwxyz".split("");

const generatePublicId = (length = 16) => {
  let ns = "";
  for (let i = 0; i < length; i++) {
    let char = randomArrayEntry(PUBLIC_ID_CHARACTERS);
    if (Math.random() < 0.5) {
      char = char.toUpperCase();
    }

    ns += char;
  }

  return ns;
};

export {
  getEpoch,
  clamp,
  checkRequiredParameters,
  checkEmail,
  getUUID,
  generatePublicId,
  checkKakapoId,
  checkDisplayName,
  checkPassword
};
