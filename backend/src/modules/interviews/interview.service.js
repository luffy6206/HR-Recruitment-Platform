import Interview from "./interview.model.js";
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

export const createInterview =
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

    const interview =
      await Interview.create({
        ...payload,

        scheduledBy:
          userId,
      });

    await changeCandidateStatus(
      payload.candidateId,

      CANDIDATE_STATUS.INTERVIEW_SCHEDULED,

      userId,

      "Interview scheduled"
    );

    await createTimelineEvent({
      candidateId:
        payload.candidateId,

      eventType:
        TIMELINE_EVENTS.INTERVIEW_SCHEDULED,

      title:
        "Interview Scheduled",

      description: `${payload.interviewType} interview scheduled`,

      performedBy:
        userId,
    });

    await createNotification({
      userId,

      title:
        "Interview Scheduled",

      message:
        "Interview has been scheduled",

      type:
        "INTERVIEW",
    });

    return interview;
  };

  export const completeInterview =
  async (
    interviewId,
    payload,
    userId
  ) => {
    const interview =
      await Interview.findById(
        interviewId
      );

    if (!interview) {
      throw new AppError(
        "Interview not found",
        404
      );
    }

    interview.status =
      "COMPLETED";

    interview.feedback =
      payload.feedback;

    interview.rating =
      payload.rating;

    await interview.save();

    await changeCandidateStatus(
      interview.candidateId,

      CANDIDATE_STATUS.INTERVIEW_COMPLETED,

      userId,

      "Interview completed"
    );

    return interview;
  };

export const evaluateInterview = async (
  interviewId,
  payload,
  userId
) => {
  const interview = await Interview.findById(interviewId);

  if (!interview) {
    throw new AppError("Interview not found", 404);
  }

  const oldDecision = interview.decision;
  interview.decision = payload.decision;
  if (payload.reason) {
    interview.decisionReason = payload.reason;
  }
  
  await interview.save();

  await createAuditLog({
    candidateId: interview.candidateId,
    fieldName: "interview.decision",
    oldValue: oldDecision || "NONE",
    newValue: payload.decision,
    changedBy: userId,
    reason: payload.reason || ""
  });

  if (payload.decision === "SELECT") {
    await changeCandidateStatus(
      interview.candidateId,
      CANDIDATE_STATUS.SELECTED,
      userId,
      "Candidate selected after interview"
    );

    await createTimelineEvent({
      candidateId: interview.candidateId,
      eventType: TIMELINE_EVENTS.INTERVIEW_SELECTED,
      title: "Candidate Selected",
      description: "Candidate was selected in the interview evaluation",
      performedBy: userId,
    });
  } else if (payload.decision === "TASK") {
    // candidate status remains eligible for task assignment (INTERVIEW_COMPLETED)
    await createTimelineEvent({
      candidateId: interview.candidateId,
      eventType: TIMELINE_EVENTS.INTERVIEW_TASK_ASSIGNED,
      title: "Task Assigned",
      description: "Candidate was marked for a task assignment after interview",
      performedBy: userId,
    });
  } else if (payload.decision === "DROP") {
    await changeCandidateStatus(
      interview.candidateId,
      CANDIDATE_STATUS.DROPPED,
      userId,
      payload.reason
    );

    await createTimelineEvent({
      candidateId: interview.candidateId,
      eventType: TIMELINE_EVENTS.INTERVIEW_DROPPED,
      title: "Candidate Dropped",
      description: `Candidate was dropped in interview evaluation: ${payload.reason}`,
      performedBy: userId,
    });
  }

  return interview;
};