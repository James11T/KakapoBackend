import { checkRequiredParameters } from "../utils/validations.js";
import { sendError, MissingParametersError } from "../errors/apierrors";

const requireData = (parameters, source = "body") => {
  return async (req, res, next) => {
    const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req[source], parameters);
    if (!hasRequiredParameters) {
      return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
    }

    return next();
  };
};

export { requireData };
