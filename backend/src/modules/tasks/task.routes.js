import express from "express";

import protect from "../../middleware/auth.middleware.js";

import validateRequest from "../../shared/utils/validateRequest.js";

import {
  createTaskValidation,
  submitTaskValidation,
  evaluateTaskValidation,
} from "./task.validation.js";

import * as controller from "./task.controller.js";

const router =
  express.Router();

router.get(
  "/",
  protect,
  controller.listTasks
);

router.get(
  "/:id",
  protect,
  controller.getTask
);

router.post(
  "/",
  protect,
  createTaskValidation,
  validateRequest,
  controller.createTask
);

router.patch(
  "/:id/submit",
  protect,
  submitTaskValidation,
  validateRequest,
  controller.submitTask
);

router.patch(
  "/:id/review",
  protect,
  evaluateTaskValidation,
  validateRequest,
  controller.reviewTask
);

export default router;