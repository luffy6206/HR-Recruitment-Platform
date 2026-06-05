import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as callService from "./call.service.js";

export const createCall =
  asyncHandler(async (req, res) => {
    const call =
      await callService.createCall(
        req.body,
        req.user.id,
        req.user.role
      );

    return successResponse(
      res,
      call,
      "Call logged",
      201
    );
  });

export const todayFollowUps = asyncHandler(async (req, res) => {
  const data = await callService.getTodayFollowUps();

  return successResponse(res, data);
});

export const upcomingFollowUps = asyncHandler(async (req, res) => {
  const data = await callService.getUpcomingFollowUps();

  return successResponse(res, data);
});