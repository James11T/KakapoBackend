import { clamp } from "./funcs.js";

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
 * Check that an object has all all the fields defined in requiredParameters
 *
 * @param {Object} obj An object to check for required parameters
 * @param {string[]} requiredParameters The required parameters
 *
 * @return {*[boolean, string[]]} Returns a boolean that dictates wether all required parameters are present and an array of missing parameters
 */
const checkRequiredParameters = (obj, requiredParameters) => {
  const missingParameters = requiredParameters.filter((requiredParameter) => obj[requiredParameter] == null, true);

  return [missingParameters.length === 0, missingParameters];
};

export { checkEmail, checkKakapoId, checkDisplayName, checkPassword, checkRequiredParameters };
