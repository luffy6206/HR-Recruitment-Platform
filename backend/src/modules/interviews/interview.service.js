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

export const listInterviews =
  async () => {
    return Interview.find()
      .populate("candidateId", "name email code")
      .populate("scheduledBy", "name email")
      .sort({ scheduledAt: -1 });
  };

export const getInterview =
  async (interviewId) => {
    const interview = await Interview.findById(interviewId)
      .populate("candidateId", "name email code")
      .populate("scheduledBy", "name email");

    if (!interview) {
      throw new AppError("Interview not found", 404);
    }

    return interview;
  };

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

    // Check if candidate is LINED_UP
    if (candidate.status !== CANDIDATE_STATUS.LINED_UP) {
      throw new AppError(
        "Interview can only be scheduled for candidates in LINED_UP status",
        400
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

      description: `${payload.interviewType} interview scheduled for ${payload.interviewDate}`,

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

export const bulkScheduleInterviews = async (
  payload,
  userId
) => {
  const { candidateIds, interviewType, scheduledAt, interviewerName, meetingLink } = payload;

  if (!candidateIds || candidateIds.length === 0) {
    throw new AppError("No candidates selected", 400);
  }

  if (!interviewerName) {
    throw new AppError("Interviewer name is required", 400);
  }

  if (!scheduledAt) {
    throw new AppError("Scheduled date/time is required", 400);
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw new AppError("Invalid scheduled date/time", 400);
  }

  const results = [];
  const errors = [];

  for (const candidateId of candidateIds) {
    try {
      const candidate = await Candidate.findById(candidateId);
      
      if (!candidate) {
        errors.push({ candidateId, message: "Candidate not found" });
        continue;
      }

      if (candidate.status !== CANDIDATE_STATUS.LINED_UP) {
        errors.push({ 
          candidateId, 
          message: `Candidate status is ${candidate.status}, must be LINED_UP` 
        });
        continue;
      }

      const interview = await Interview.create({
        candidateId,
        interviewType,
        scheduledAt: scheduledDate,
        interviewerName,
        meetingLink,
        scheduledBy: userId,
      });

      await changeCandidateStatus(
        candidateId,
        CANDIDATE_STATUS.INTERVIEW_SCHEDULED,
        userId,
        "Interview scheduled"
      );

      await createTimelineEvent({
        candidateId,
        eventType: TIMELINE_EVENTS.INTERVIEW_SCHEDULED,
        title: "Interview Scheduled",
        description: `${interviewType} interview scheduled for ${scheduledDate.toISOString()}`,
        performedBy: userId,
      });

      await createNotification({
        userId,
        title: "Interview Scheduled",
        message: `Interview has been scheduled for ${candidate.name}`,
        type: "INTERVIEW",
      });

      results.push({ candidateId, success: true, interview });
    } catch (error) {
      errors.push({ candidateId, message: error.message });
    }
  }

  return { scheduled: results, failed: errors };
};