import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as interviewService from "./interview.service.js";

export const createInterview =
  asyncHandler(async (req, res) => {
    const interview =
      await interviewService.createInterview(
        req.body,
        req.user.id
      );

    return successResponse(
      res,
      interview,
      "Interview scheduled",
      201
    );
  });

export const completeInterview =
  asyncHandler(async (req, res) => {
    const interview =
      await interviewService.completeInterview(
        req.params.id,
        req.body,
        req.user.id
      );

    return successResponse(
      res,
      interview,
      "Interview completed"
    );
  });

export const evaluateInterview =
  asyncHandler(async (req, res) => {
    const interview =
      await interviewService.evaluateInterview(
        req.params.id,
        req.body,
        req.user.id
      );

    return successResponse(
      res,
      interview,
      "Interview evaluated"
    );
  });