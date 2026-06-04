import express from "express";

import protect from "../../middleware/auth.middleware.js";

import * as controller from "./dailyReport.controller.js";

const router = express.Router();

router.post(
  "/generate",
  protect,
  controller.generateReport
);

router.get(
  "/me",
  protect,
  controller.getMyReports
);

export default router;
