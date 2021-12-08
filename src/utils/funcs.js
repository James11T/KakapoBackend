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

export { getEpoch, clamp, getUUID, generatePublicId };
