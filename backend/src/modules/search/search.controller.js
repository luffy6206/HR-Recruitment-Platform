import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import {
  globalSearch,
} from "./search.service.js";

export const search =
  asyncHandler(async (req, res) => {
    const results =
      await globalSearch(
        req.query
      );

    return successResponse(
      res,
      results
    );
  });