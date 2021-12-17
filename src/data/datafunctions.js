import {
  MissingParametersError,
  BadParametersError,
  GenericError,
  KakapoIDReservedError,
} from "../errors/apierrors.js";
import { getEpoch, getUUID } from "../utils/funcs.js";
import { checkRequiredParameters, checkEmail, checkKakapoId, checkPassword } from "../utils/validations.js";
import { isKakapoIDInUse } from "../utils/database.js";
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
  kakapo_id = kakapo_id.trim();

  if (!checkEmail(email)) {
    return [new BadParametersError({ badParameters: ["email"] }), null];
  }

  if (!checkKakapoId(kakapo_id)) {
    return [new BadParametersError({ badParameters: ["kakapo_id"] }), null];
  }

  if (display_name) {
    display_name = display_name.trim();
    if (!checkDisplayName(display_name)) {
      return [new BadParametersError({ badParameters: ["display_name"] }), null];
    }
  } else {
    display_name = kakapo_id;
  }

  if (!checkPassword(password)) {
    return [new BadParametersError({ badParameters: ["password"] }), null];
  }

  const [checkIDError, isInUse] = await isKakapoIDInUse(kakapo_id);
  if (checkIDError) {
    return sendError(res, new GenericError());
  }
  if (isInUse) {
    return sendError(res, new KakapoIDReservedError());
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
