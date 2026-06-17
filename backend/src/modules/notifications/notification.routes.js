import express from "express";

import protect from "../../middleware/auth.middleware.js";

import * as controller from "./notification.controller.js";

const router =
  express.Router();

router.get(
  "/",
  protect,
  controller.getNotifications
);

router.patch(
  "/read-all",
  protect,
  controller.markAllRead
);

router.patch(
  "/:id/read",
  protect,
  controller.markAsRead
);

router.delete(
  "/",
  protect,
  controller.clearNotifications
);

export default router;