import Candidate from "./candidate.model.js";

import AppError from "../../shared/errors/AppError.js";

import { createAuditLog } from "../../shared/services/audit.service.js";

import { createTimelineEvent } from "../../shared/services/timeline.service.js";

import { TIMELINE_EVENTS } from "../../constants/timelineEvents.js";

export const changeCandidateStatus =
  async (
    candidateId,
    status,
    userId,
    note = ""
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
      status;

    await candidate.save();

    await createAuditLog({
      candidateId,

      fieldName:
        "status",

      oldValue: oldStatus,

      newValue: status,

      changedBy: userId,

      reason: note,
    });

    await createTimelineEvent({
      candidateId,

      eventType:
        TIMELINE_EVENTS.STATUS_CHANGED,

      title:
        "Status Changed",

      description: `${oldStatus} → ${status}`,

      performedBy: userId,
    });

    return candidate;
  };