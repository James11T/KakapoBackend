import express from "express";

import { checkRequiredParameters } from "../utils/validations.js";
import { sendError, MissingParametersError, GenericError } from "../errors/apierrors.js";

const explorePeople = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(req.params, ["search_term"]);
  if (!hasRequiredParameters) {
    return sendError(res, new MissingParametersError({ missingParameters: missingParameters }));
  }

  const { search_term } = req.params;

  const [exploreError, exploreResult] = await global.db
    .table("user")
    .all("*", { kakapo_id: { operator: "LIKE", value: `%${search_term}%`, caseInsensitive: true } });
  if (exploreError) {
    return sendError(res, new GenericError());
  }

  return res.send({ users: exploreResult.map((user) => global.db.table("user").filter(user, 0)) });
};

const getExploreRoutes = () => {
  const router = express.Router();

  router.get("/users/:search_term", explorePeople);
  return router;
};

export { getExploreRoutes };
