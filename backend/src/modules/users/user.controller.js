import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as userService from "./user.service.js";

export const createUser =
  asyncHandler(async (req, res) => {
    const user =
      await userService.createUser(
        req.body
      );

    return successResponse(
      res,
      user,
      "User created",
      201
    );
  });

export const getUsers =
  asyncHandler(async (req, res) => {
    const users =
      await userService.getUsers();

    return successResponse(
      res,
      users
    );
  });

export const getUser =
  asyncHandler(async (req, res) => {
    const user =
      await userService.getUser(
        req.params.id
      );

    return successResponse(
      res,
      user
    );
  });

export const updateUser =
  asyncHandler(async (req, res) => {
    const user =
      await userService.updateUser(
        req.params.id,
        req.body
      );

    return successResponse(
      res,
      user,
      "User updated"
    );
  });

export const deleteUser =
  asyncHandler(async (req, res) => {
    const user =
      await userService.deleteUser(
        req.params.id
      );

    return successResponse(
      res,
      user,
      "User deactivated"
    );
  });

export const getHRUsers =
  asyncHandler(async (req, res) => {
    const users =
      await userService.getHRUsers();

    return successResponse(
      res,
      users
    );
  });