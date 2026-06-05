import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as taskService from "./task.service.js";

export const listTasks =
  asyncHandler(async (req, res) => {
    const tasks =
      await taskService.listTasks();

    return successResponse(
      res,
      tasks
    );
  });

export const getTask =
  asyncHandler(async (req, res) => {
    const task =
      await taskService.getTask(
        req.params.id
      );

    return successResponse(
      res,
      task
    );
  });

export const createTask =
  asyncHandler(async (req, res) => {
    const task =
      await taskService.createTask(
        req.body,
        req.user.id
      );

    return successResponse(
      res,
      task,
      "Task assigned",
      201
    );
  });

export const submitTask =
  asyncHandler(async (req, res) => {
    const task =
      await taskService.submitTask(
        req.params.id,
        req.body.submissionLink,
        req.user.id
      );

    return successResponse(
      res,
      task,
      "Task submitted"
    );
  });

export const reviewTask =
  asyncHandler(async (req, res) => {
    const task =
      await taskService.reviewTask(
        req.params.id,
        req.body,
        req.user.id
      );

    return successResponse(
      res,
      task,
      "Task reviewed"
    );
  });