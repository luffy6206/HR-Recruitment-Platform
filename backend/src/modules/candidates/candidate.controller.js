import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as candidateService from "./candidate.service.js";

export const createCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await candidateService.createCandidate(
        req.body,
        req.user.id
      );

    return successResponse(
      res,
      candidate,
      "Candidate created",
      201
    );
  });

export const getCandidates =
  asyncHandler(async (req, res) => {
    const result =
      await candidateService.getCandidates(
        req.query,
        req.user
      );

    return successResponse(
      res,
      result
    );
  });

export const getCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await candidateService.getCandidateById(
        req.params.id
      );

    return successResponse(
      res,
      candidate
    );
  });

export const updateCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await candidateService.updateCandidate(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );

    return successResponse(
      res,
      candidate,
      "Candidate updated"
    );
  });

export const deleteCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await candidateService.softDeleteCandidate(
        req.params.id,
        req.user.id
      );

    return successResponse(
      res,
      candidate,
      "Candidate deleted"
    );
  });