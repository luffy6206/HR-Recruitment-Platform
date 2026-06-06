import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  successResponse,
} from "../../shared/response/apiResponse.js";

import * as workflowService from "./candidateWorkflow.service.js";

export const assignCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await workflowService.assignCandidate(
        req.params.id,
        req.body.hrId,
        req.user.id
      );

    return successResponse(
      res,
      candidate,
      "Candidate assigned"
    );
  });

export const selectCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await workflowService.selectCandidate(
        req.params.id,
        req.user.id
      );

    return successResponse(
      res,
      candidate,
      "Candidate selected"
    );
  });

export const dropCandidate =
  asyncHandler(async (req, res) => {
    const candidate =
      await workflowService.dropCandidate(
        req.params.id,
        req.body.reason,
        req.user.id
      );

    return successResponse(
      res,
      candidate,
      "Candidate dropped"
    );
  });

export const addSkill =
  asyncHandler(async (req, res) => {
    const candidate =
      await workflowService.addSkill(
        req.params.id,
        req.body.skill,
        req.user.id,
        req.user.role
      );

    return successResponse(
      res,
      candidate,
      "Skill added"
    );
  });

export const addProject =
  asyncHandler(async (req, res) => {
    const project = req.body;
    const candidate = await workflowService.addProject(
      req.params.id,
      project,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Project added");
  });

export const updateProject =
  asyncHandler(async (req, res) => {
    const project = req.body;
    const candidate = await workflowService.updateProject(
      req.params.id,
      Number(req.params.index),
      project,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Project updated");
  });

export const deleteProject =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.deleteProject(
      req.params.id,
      Number(req.params.index),
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Project deleted");
  });

export const logCall =
  asyncHandler(async (req, res) => {
    const payload = req.body;

    const result = await workflowService.logCall(
      req.params.id,
      payload,
      req.user.id,
      req.user.role
    );

    return successResponse(res, result, "Call logged");
  });

export const updateEducation =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.updateEducation(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Education updated");
  });

export const addExperience =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.addExperience(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Experience added");
  });

export const updateExperience =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.updateExperience(
      req.params.id,
      Number(req.params.index),
      req.body,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Experience updated");
  });

export const deleteExperience =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.deleteExperience(
      req.params.id,
      Number(req.params.index),
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Experience deleted");
  });

export const addCertification =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.addCertification(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Certification added");
  });

export const updateCertification =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.updateCertification(
      req.params.id,
      Number(req.params.index),
      req.body,
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Certification updated");
  });

export const deleteCertification =
  asyncHandler(async (req, res) => {
    const candidate = await workflowService.deleteCertification(
      req.params.id,
      Number(req.params.index),
      req.user.id,
      req.user.role
    );

    return successResponse(res, candidate, "Certification deleted");
  });