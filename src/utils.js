import fs from "fs";
import { randomUUID } from "crypto";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getEpoch = () => {
  /**
   * Get the current epoch in seconds
   * 
   * @return {number} The ammount of secconds since 01/01/1970
   */

  const now = new Date().getTime();

  // Convert from ms to s
  const epoch = Math.floor(now / 1000);

  return epoch;
};

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const checkRequiredParameters = (obj, requiredParameters) => {
  /**
   * Check that an object has all all the fields defined in requiredParameters
   * 
   * @param {Object} obj An object to check for required parameters
   * @param {string[]} requiredParameters The required parameters
   * 
   * @return {*[boolean, string[]]} Returns a boolean that dictates wether all required parameters are present and an array of missing parameters
   */

  const missingParameters = requiredParameters.filter((requiredParameter) => !obj[requiredParameter], true);

  return [missingParameters.length === 0, missingParameters];
};

const checkEmail = (email) => {
  /**
   * Check an email for validity
   * 
   * @param {string} email The email to check
   * 
   * @return {boolean} True if the email is valid
   */

  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
};

const checkKakapoId = (kakapoId) => {
  /**
   * Check a kakapo ID for validity
   * 
   * @param {string} kakapoId The kakapo ID to check
   * 
   * @return {boolean} True if the kakapo ID is valid
   */

  return kakapoId.length === clamp(kakapoId.length, 2, 32) && !kakapoId.includes(" ");
};

const checkDisplayName = (displayName) => {
  /**
   * Check a display name for validity
   * 
   * @param {string} displayName The display name to check
   * 
   * @return {boolean} True if the display name is valid
   */

  return displayName.length === clamp(kakapoId.length, 2, 32);
};

const checkPassword = (password) => {
  /**
   * Check a password for validity
   * 
   * @param {string} displayName The password to check
   * 
   * @return {boolean} True if the password is valid
   */

  return password.length === clamp(password.length, 8, 256);
};

const getUUID = () => {
  /**
   * Return a probable unique identifier
   * 
   * @return {string} The unique identifier
   */

  return randomUUID();
};

const randomArrayEntry = (array) => {
  /**
   * Select a random entry from a given array
   * 
   * @return {*[]} The array to select from
   */

  return array[Math.floor(Math.random() * array.length)];
};

const PUBLIC_ID_CHARACTERS = "abcdefghijklmnopqrstuvwxyz".split("");

const generatePublicId = (length = 16) => {
  /**
   * Generate a random string made of alphabetic letters of a given length
   * 
   * @param {number} [length=16] The length of the string
   * 
   * @return {string} The random string
   */


  let ns = "";
  for (let i = 0; i < length; i++) {
    let char = randomArrayEntry(PUBLIC_ID_CHARACTERS);
    if (Math.random() < 0.5) {
      // 50% chance to be uppercase
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
