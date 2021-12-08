import { MissingParametersError, BadParametersError, GenericError } from "../errors/apierrors.js";
import { checkRequiredParameters, checkEmail, getEpoch, getUUID, checkKakapoId, checkPassword } from "../utils.js";
import { hashPassword, toPasswordHashString } from "../auth/passwords.js";

/**
 * Create a new user in the database if all the content checks are valid
 *
 * @param {string} data.kakapo_id The desired kakapo_id of the users
 * @param {string} data.email The email to be associated with the user
 * @param {string} data.password The desured password for the user
 * @param {string} [data.display_name=data.kakapo_id] The desired display name of the user
 *
 * @returns {[error, result]} The error, if errored, or the result if succeeded
 */
const createNewUser = async (data) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(data, ["kakapo_id", "email", "password"]);
  if (!hasRequiredParameters) {
    return [new MissingParametersError({ missingParameters: missingParameters }), null];
  }

  let { kakapo_id, email, password, display_name } = data;

  if (!checkEmail(email)) {
    return [new BadParametersError({ badParameters: ["email"] }), null];
  }

  if (!checkKakapoId(kakapo_id)) {
    return [new BadParametersError({ badParameters: ["kakapo_id"] }), null];
  }

  if (display_name) {
    if (!checkDisplayName(display_name)) {
      return [new BadParametersError({ badParameters: ["display_name"] }), null];
    }
  } else {
    display_name = kakapo_id;
  }

  if (!checkPassword(password)) {
    return [new BadParametersError({ badParameters: ["password"] }), null];
  }

  const [getUserError, checkId] = await global.db.table("user").first(["kakapo_id"], { kakapo_id: kakapo_id });
  if (getUserError) {
    return [new GenericError(), null];
  }

  if (checkId) {
    // KakapoID is taken
    return [new BadParametersError({ badParameters: ["kakapo_id"], message: "kakapo_id is unavailable" }), null];
  }

  const { salt, hash } = await hashPassword(password);

  let newUser = {
    kakapo_id: kakapo_id,
    display_name: display_name,
    email: email,
    password: toPasswordHashString(salt, hash),
    joined: getEpoch(),
    public_id: getUUID(),
  };

  const [createUserError, createUserResults] = await global.db.table("user").new(newUser);
  if (createUserError) {
    return [createUserError, null];
  }

  return [null, createUserResults];
};

export { createNewUser };
