import { randomUUID } from "crypto";

const PUBLIC_ID_CHARACTERS = "abcdefghijklmnopqrstuvwxyz".split("");

/**
 * Get the current epoch in seconds
 *
 * @return {number} The ammount of secconds since 01/01/1970
 */
const getEpoch = () => {
  const now = new Date().getTime();

  // Convert from ms to s
  const epoch = Math.floor(now / 1000);

  return epoch;
};

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * Check that an object has all all the fields defined in requiredParameters
 *
 * @param {Object} obj An object to check for required parameters
 * @param {string[]} requiredParameters The required parameters
 *
 * @return {*[boolean, string[]]} Returns a boolean that dictates wether all required parameters are present and an array of missing parameters
 */
const checkRequiredParameters = (obj, requiredParameters) => {
  const missingParameters = requiredParameters.filter((requiredParameter) => !obj[requiredParameter], true);

  return [missingParameters.length === 0, missingParameters];
};

/**
 * Check an email for validity
 *
 * @param {string} email The email to check
 *
 * @return {boolean} True if the email is valid
 */
const checkEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
};

/**
 * Check a kakapo ID for validity
 *
 * @param {string} kakapoId The kakapo ID to check
 *
 * @return {boolean} True if the kakapo ID is valid
 */
const checkKakapoId = (kakapoId) => {
  return kakapoId.length === clamp(kakapoId.length, 2, 32) && !kakapoId.includes(" ");
};

/**
 * Check a display name for validity
 *
 * @param {string} displayName The display name to check
 *
 * @return {boolean} True if the display name is valid
 */
const checkDisplayName = (displayName) => {
  return displayName.length === clamp(kakapoId.length, 2, 32);
};

/**
 * Check a password for validity
 *
 * @param {string} displayName The password to check
 *
 * @return {boolean} True if the password is valid
 */
const checkPassword = (password) => {
  return password.length === clamp(password.length, 8, 256);
};

/**
 * Return a probable unique identifier
 *
 * @return {string} The unique identifier
 */
const getUUID = () => {
  return randomUUID();
};

/**
 * Select a random entry from a given array
 *
 * @return {*[]} The array to select from
 */
const randomArrayEntry = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate a random string made of alphabetic letters of a given length
 *
 * @param {number} [length=16] The length of the string
 *
 * @return {string} The random string
 */
const generatePublicId = (length = 16) => {
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
  checkPassword,
};
