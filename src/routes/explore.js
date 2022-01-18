import express from "express";
import { Op } from "sequelize";

import { checkRequiredParameters } from "../utils/validations.js";
import {
  sendError,
  MissingParametersError,
  GenericError,
} from "../errors/apierrors.js";
import { db } from "../database.js";

const explorePeople = async (req, res) => {
  const [hasRequiredParameters, missingParameters] = checkRequiredParameters(
    req.params,
    ["search_term"]
  );
  if (!hasRequiredParameters) {
    return sendError(
      res,
      new MissingParametersError({ missingParameters: missingParameters })
    );
  }

  const { search_term } = req.params;

  try {
    const exploreResult = await db.models.user.findAll({
      where: {
        [Op.or]: [
          { kakapo_id: { [Op.substring]: search_term } },
          { display_name: { [Op.substring]: search_term } },
        ],
      },
    });

    // ADD FILTER
    return res.send({ users: exploreResult });
  } catch (error) {
    return sendError(
      res,
      new GenericError("Failed to search database for users.")
    );
  }
};

const getExploreRoutes = () => {
  const router = express.Router();

  router.get("/users/:search_term", explorePeople);
  return router;
};

export { getExploreRoutes };
