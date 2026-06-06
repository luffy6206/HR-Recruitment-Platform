import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as notificationService from "./notification.service.js";

export const getNotifications =
  asyncHandler(async (req, res) => {
    const notifications =
      await notificationService.getNotifications(
        req.user.id
      );

    return successResponse(
      res,
      notifications
    );
  });

export const markAsRead =
  asyncHandler(async (req, res) => {
    const notification =
      await notificationService.markAsRead(
        req.params.id,
        req.user.id
      );

    return successResponse(
      res,
      notification
    );
  });

export const clearNotifications =
  asyncHandler(async (req, res) => {
    await notificationService.clearNotifications(req.user.id);

    return successResponse(res, { cleared: true });
  });