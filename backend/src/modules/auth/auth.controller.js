import * as authService from "./auth.service.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    const { accessToken, refreshToken, user } = result;
    const safeUser = {
      id: user._id?.toString() ?? user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return successResponse(
      res,
      { accessToken, refreshToken, user: safeUser },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
};

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refreshAccessToken(req.body.refreshToken);

  return successResponse(res, data);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  return successResponse(res, null, "Logged out");
});