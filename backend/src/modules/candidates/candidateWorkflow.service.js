import Candidate from "./candidate.model.js";

import User from "../auth/auth.model.js";

import AppError from "../../shared/errors/AppError.js";

import { createAuditLog } from "../../shared/services/audit.service.js";

import { createTimelineEvent } from "../../shared/services/timeline.service.js";

import { createNotification } from "../notifications/notification.service.js";

import { CANDIDATE_STATUS } from "../../constants/candidateStatus.js";

export const assignCandidate =
  async (
    candidateId,
    hrId,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const hr =
      await User.findById(hrId);

    if (!hr) {
      throw new AppError(
        "HR not found",
        404
      );
    }

    const oldHR =
      candidate.assignedHR;

    candidate.assignedHR =
      hrId;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "assignedHR",

      oldValue: oldHR,

      newValue: hrId,

      changedBy: userId,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        "CANDIDATE_ASSIGNED",

      title:
        "Candidate Assigned",

      description: `Assigned to ${hr.name}`,

      performedBy:
        userId,
    });

    await createNotification({
      userId: hrId,

      title:
        "Candidate Assigned",

      message:
        "A new candidate has been assigned to you",

      type:
        "ASSIGNMENT",
    });

    return candidate;
  };

  export const selectCandidate =
  async (
    candidateId,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const oldStatus =
      candidate.status;

    candidate.status =
      CANDIDATE_STATUS.SELECTED;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "status",

      oldValue:
        oldStatus,

      newValue:
        CANDIDATE_STATUS.SELECTED,

      changedBy:
        userId,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        "CANDIDATE_SELECTED",

      title:
        "Candidate Selected",

      description:
        "Candidate selected",

      performedBy:
        userId,
    });

    return candidate;
  };

  export const dropCandidate =
  async (
    candidateId,
    reason,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const oldStatus =
      candidate.status;

    candidate.status =
      CANDIDATE_STATUS.DROPPED;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "status",

      oldValue:
        oldStatus,

      newValue:
        CANDIDATE_STATUS.DROPPED,

      changedBy:
        userId,

      reason,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        "CANDIDATE_DROPPED",

      title:
        "Candidate Dropped",

      description:
        reason,

      performedBy:
        userId,
    });

    return candidate;
  };