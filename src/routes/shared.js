import { MissingParametersError, UserNotFoundError, sendError } from "../errors/apierrors.js";
import { checkRequiredParameters } from "../utils/validations.js";

const getUserAtSensitivity = (sensitivity) => {
  return async (req, res) => {
    const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.body, ["kakapo_id"]);
    if (!hasRequiredParameters) {
      return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
    }

    const kakapo_id = req.body.kakapo_id;

    const [getUserError, result] = await global.db.table("user").first("*", { kakapo_id: kakapo_id });
    if (getUserError) {
      return sendError(res, getUserError);
    }

    if (!result) {
      return sendError(res, new UserNotFoundError());
    }

    return res.send({ user: global.db.table("user").filter(result, sensitivity) });
  };
};

export { getUserAtSensitivity };
