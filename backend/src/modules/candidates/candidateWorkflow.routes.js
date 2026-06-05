import express from "express";

import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import * as controller from "./candidateWorkflow.controller.js";

const router =
  express.Router();

router.patch(
  "/:id/assign",
  protect,
  authorize(ROLES.ADMIN),
  controller.assignCandidate
);

router.patch(
  "/:id/add-skill",
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  controller.addSkill
);

router.post(
  "/:id/log-call",
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  controller.logCall
);

router.post(
  "/:id/projects",
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  controller.addProject
);

router.patch(
  "/:id/projects/:index",
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  controller.updateProject
);

router.delete(
  "/:id/projects/:index",
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  controller.deleteProject
);

router.patch(
  "/:id/select",
  protect,
  controller.selectCandidate
);

router.patch(
  "/:id/drop",
  protect,
  controller.dropCandidate
);

export default router;