import express from "express";

import protect from "../../middleware/auth.middleware.js";

import validateRequest from "../../shared/utils/validateRequest.js";

import {
  createInterviewValidation,
  evaluateInterviewValidation,
} from "./interview.validation.js";

import * as controller from "./interview.controller.js";

const router =
  express.Router();

router.post(
  "/",
  protect,
  createInterviewValidation,
  validateRequest,
  controller.createInterview
);

router.patch(
  "/:id/complete",
  protect,
  controller.completeInterview
);

router.patch(
  "/:id/evaluate",
  protect,
  evaluateInterviewValidation,
  validateRequest,
  controller.evaluateInterview
);

export default router;