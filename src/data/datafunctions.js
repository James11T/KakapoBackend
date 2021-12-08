import { QueryFailedError, MissingParametersError, BadParametersError, GenericError } from "../errors/apierrors.js";
import { checkRequiredParameters, checkEmail, clamp, getEpoch, getUUID } from "../utils.js";
import { hashPassword, toPasswordHashString } from "../auth/passwords.js";

const createNewUser = async (data) => {
  /**
   * Create a new user in the database if all the content checks are valid
   * 
   * @param {string} data.kakapo_id The desired kakapo_id of the users
   * @param {string} data.email The email to be associated with the user
   */

  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(data, ["kakapo_id", "email", "password"]);
  if (!hasRequiredParameters) {
    return [new MissingParametersError({ missingParameters: missingParameters }), null];
  }

  if (!checkEmail(data.email)) {
    return [new BadParametersError({ parameter: "email" }), null];
  }

  if (data.kakapo_id.length !== clamp(data.kakapo_id.length, 2, 32) || data.kakapo_id.includes(" ")) {
    return [new BadParametersError({ badParameters: ["kakapo_id"] }), null];
  }

  if (data.display_name) {
    if (data.display_name.length !== clamp(data.display_name.length, 2, 32)) {
      return [new BadParametersError({ badParameters: ["display_name"] }), null];
    }
  } else {
    data.display_name = data.kakapo_id;
  }

  if (data.password.length !== clamp(data.password.length, 8, 256)) {
    return [new BadParametersError({ badParameters: ["password"] }), null];
  }

  const [getUserError, checkId] = await global.db.table("user").first(["kakapo_id"], { kakapo_id: data.kakapo_id });
  if (getUserError) {
    return [new GenericError(), null];
  }

  if (checkId) {
    // KakapoID is taken
    return [new BadParametersError({ badParameters: ["kakapo_id"] , message: "kakapo_id is unavailable" }), null];
  }

  const { salt, hash } = await hashPassword(data.password);

  data.password = toPasswordHashString(salt, hash);
  data.joined = getEpoch();
  data.public_id = getUUID();

  const [createUserError, createUserResults] = await global.db.table("user").new(data);
  if (createUserError) {
    return [createUserError, null];
  }

  return [null, createUserResults];
};

export { createNewUser };
