import crypto from "crypto";

const hashPassword = async (unhashedPassword, setSalt) => {
  /**
   * Hash a password with a salt
   * @param {string} unhashedPassword The password to hash
   * @param {string} [setSalt] Apply a set salt rather than generate a new random one
   *
   * @returns {object} The salt used and the hash that was computed
   */

  const salt = setSalt || crypto.randomBytes(process.env.PASSWORD_HASH_SALT_LENGTH / 2);
  const hashedPassword = crypto.scryptSync(unhashedPassword, salt, process.env.PASSWORD_HASH_KEY_LENGTH / 2);

  return {
    salt: salt,
    hash: hashedPassword,
  };
};

const checkHash = async (saltAndHash, password) => {
  /**
   * Check if the password matches the salt and hash
   * @param {string} saltAndHash The salt and hash of a password in the form salt:hash
   * @param {string} password The password to check
   *
   * @returns {bool} A timing safe boolean indicating password equality
   */

  const [passwordSalt, passwordHash] = saltAndHash.split(":")

  const { hash } = await hashPassword(password, Buffer.from(passwordSalt, "hex"));
  const passwordHashBuffer = Buffer.from(passwordHash, "hex");


  return crypto.timingSafeEqual(hash, passwordHashBuffer);
};

function toPasswordHashString(salt, hash) {
  /**
   * Convert salt and hash buffers to hex string
   * @param {Buffer} salt Password salt
   * @param {Buffer} hash Password hash
   *
   * @returns {string} salt:hash as hex string
   */

  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export { hashPassword, checkHash, toPasswordHashString };
