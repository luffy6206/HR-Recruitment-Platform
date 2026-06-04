import Task from "./task.model.js";
import { createNotification } from "../notifications/notification.service.js";
import { createAuditLog } from "../../shared/services/audit.service.js";

import Candidate from "../candidates/candidate.model.js";

import AppError from "../../shared/errors/AppError.js";

import { createTimelineEvent } from "../../shared/services/timeline.service.js";

import { changeCandidateStatus } from "../candidates/candidateStatus.service.js";

import {
  CANDIDATE_STATUS,
} from "../../constants/candidateStatus.js";

import {
  TIMELINE_EVENTS,
} from "../../constants/timelineEvents.js";

export const createTask =
  async (
    payload,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        payload.candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const task =
      await Task.create({
        ...payload,
        assignedBy: userId,
      });

    await changeCandidateStatus(
      payload.candidateId,
      CANDIDATE_STATUS.TASK_ASSIGNED,
      userId,
      "Task assigned"
    );

    await createTimelineEvent({
      candidateId:
        payload.candidateId,

      eventType:
        TIMELINE_EVENTS.TASK_ASSIGNED,

      title:
        "Task Assigned",

      description:
        payload.title,

      performedBy:
        userId,
    });

    await createNotification({
      userId,

      title:
        "Task Assigned",

      message:
        "Candidate task assigned",

      type:
        "TASK",
    });

    return task;
  };

export const submitTask =
  async (
    taskId,
    submissionLink,
    userId
  ) => {
    const task =
      await Task.findById(
        taskId
      );

    if (!task) {
      throw new AppError(
        "Task not found",
        404
      );
    }

    task.status =
      "SUBMITTED";

    task.submissionLink =
      submissionLink;

    await task.save();

    await changeCandidateStatus(
      task.candidateId,
      CANDIDATE_STATUS.TASK_REVIEW,
      userId,
      "Task submitted"
    );

    return task;
  };

export const reviewTask =
  async (
    taskId,
    payload,
    userId
  ) => {
    const task =
      await Task.findById(taskId);

    if (!task) {
      throw new AppError(
        "Task not found",
        404
      );
    }

    if (task.status !== "SUBMITTED") {
      throw new AppError(
        "Task must be in SUBMITTED status to review",
        400
      );
    }

    const { outcome } = payload;
    const oldOutcome = task.reviewOutcome;

    // --- SATISFIED ---
    if (outcome === "SATISFIED") {
      task.status = "PASSED";
      task.reviewOutcome = "SATISFIED";
      task.reviewNotes = payload.reviewNotes || null;
      task.score = payload.score || null;
      await task.save();

      await createAuditLog({
        candidateId: task.candidateId,
        fieldName: "task.reviewOutcome",
        oldValue: oldOutcome || "NONE",
        newValue: outcome,
        changedBy: userId,
        reason: payload.reviewNotes || ""
      });

      await changeCandidateStatus(
        task.candidateId,
        CANDIDATE_STATUS.SELECTED,
        userId,
        "Task passed — candidate selected"
      );

      await createTimelineEvent({
        candidateId: task.candidateId,
        eventType: TIMELINE_EVENTS.TASK_PASSED,
        title: "Task Passed",
        description: "Task review outcome: SATISFIED — candidate selected",
        performedBy: userId,
      });

      return task;
    }

    // --- FAILED ---
    if (outcome === "FAILED") {
      task.status = "FAILED";
      task.reviewOutcome = "FAILED";
      task.reviewReason = payload.reason;
      task.reviewNotes = payload.reviewNotes || null;
      task.score = payload.score || null;
      await task.save();

      await createAuditLog({
        candidateId: task.candidateId,
        fieldName: "task.reviewOutcome",
        oldValue: oldOutcome || "NONE",
        newValue: outcome,
        changedBy: userId,
        reason: payload.reason || payload.reviewNotes || ""
      });

      await changeCandidateStatus(
        task.candidateId,
        CANDIDATE_STATUS.DROPPED,
        userId,
        payload.reason
      );

      await createTimelineEvent({
        candidateId: task.candidateId,
        eventType: TIMELINE_EVENTS.TASK_FAILED,
        title: "Task Failed",
        description: `Task review outcome: FAILED — ${payload.reason}`,
        performedBy: userId,
      });

      return task;
    }

    // --- NEEDS_IMPROVEMENT ---
    if (outcome === "NEEDS_IMPROVEMENT") {
      task.status = "REVIEWED";
      task.reviewOutcome = "NEEDS_IMPROVEMENT";
      task.reviewReason = payload.reason || null;
      task.reviewNotes = payload.reviewNotes || null;
      task.score = payload.score || null;
      await task.save();

      await createAuditLog({
        candidateId: task.candidateId,
        fieldName: "task.reviewOutcome",
        oldValue: oldOutcome || "NONE",
        newValue: outcome,
        changedBy: userId,
        reason: payload.reason || payload.reviewNotes || ""
      });

      // Create a new re-task preserving full history
      const reTask = await Task.create({
        candidateId: task.candidateId,
        assignedBy: task.assignedBy,
        title: task.title,
        description: task.description,
        deadline: payload.newDeadline,
        reTaskOf: task._id,
        status: "ASSIGNED",
      });

      await createAuditLog({
        candidateId: task.candidateId,
        fieldName: "task.reTaskCreated",
        oldValue: "NONE",
        newValue: reTask._id.toString(),
        changedBy: userId,
        reason: "Re-task created due to NEEDS_IMPROVEMENT outcome"
      });

      // Candidate remains active — set back to TASK_ASSIGNED
      await changeCandidateStatus(
        task.candidateId,
        CANDIDATE_STATUS.TASK_ASSIGNED,
        userId,
        "Re-task assigned after review"
      );

      await createTimelineEvent({
        candidateId: task.candidateId,
        eventType: TIMELINE_EVENTS.TASK_REWORK_REQUESTED,
        title: "Task Rework Requested",
        description: `Task review outcome: NEEDS_IMPROVEMENT — re-task created with new deadline`,
        performedBy: userId,
      });

      return { originalTask: task, reTask };
    }

    throw new AppError("Invalid outcome", 400);
  };