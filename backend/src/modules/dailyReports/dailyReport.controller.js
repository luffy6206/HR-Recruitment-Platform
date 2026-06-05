import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as dailyReportService from "./dailyReport.service.js";

export const generateReport =
  asyncHandler(async (req, res) => {
    const report =
      await dailyReportService.generateDailyReport(
        req.user.id
      );

    return successResponse(
      res,
      report,
      "Daily report generated",
      201
    );
  });

export const getMyReports =
  asyncHandler(async (req, res) => {
    const reports =
      await dailyReportService.getMyReports(
        req.user.id
      );

    return successResponse(
      res,
      reports,
      "Daily reports retrieved"
    );
  });
