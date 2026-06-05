import Call from "./call.model.js";
import { createNotification } from "../notifications/notification.service.js";

import Candidate from "../candidates/candidate.model.js";

import AppError from "../../shared/errors/AppError.js";

import { createTimelineEvent } from "../../shared/services/timeline.service.js";

import { TIMELINE_EVENTS } from "../../constants/timelineEvents.js";

import { CALL_OUTCOMES } from "../../constants/callOutcomes.js";

import { INTEREST_STATUS } from "../../constants/interestStatus.js";

import { CANDIDATE_STATUS } from "../../constants/candidateStatus.js";

import { changeCandidateStatus } from "../candidates/candidateStatus.service.js";

export const createCall =
  async (
    payload,
    userId,
    userRole
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

    const assignedHRId =
      candidate.assignedHR &&
      (candidate.assignedHR._id ?? candidate.assignedHR);

    if (
      userRole === "HR" &&
      String(assignedHRId) !== userId
    ) {
      throw new AppError(
        "Not authorized to log calls for this candidate",
        403
      );
    }

    const previousCalls =
      await Call.countDocuments({
        candidateId:
          payload.candidateId,
      });

    if (previousCalls >= 3) {
      throw new AppError(
        "Maximum call attempts reached",
        400
      );
    }

    const attemptNumber =
      previousCalls + 1;

    const call =
      await Call.create({
        ...payload,

        attemptNumber,

        createdBy: userId,
      });

    await createTimelineEvent({
      candidateId:
        payload.candidateId,

      eventType:
        TIMELINE_EVENTS.CALL_LOGGED,

      title:
        "Call Logged",

      description: payload.note,

      performedBy: userId,
    });

    if (
      payload.interestStatus ===
      INTEREST_STATUS.INTERESTED
    ) {
      // Set status to LINED_UP when candidate is interested
      await changeCandidateStatus(
        payload.candidateId,
        CANDIDATE_STATUS.LINED_UP,
        userId,
        "Candidate interested in opportunity"
      );

      // Create timeline event for candidate lined up
      await createTimelineEvent({
        candidateId:
          payload.candidateId,

        eventType:
          TIMELINE_EVENTS.CANDIDATE_LINED_UP,

        title:
          "Candidate Lined Up",

        description: `Candidate is interested after ${attemptNumber === 1 ? "first" : attemptNumber === 2 ? "second" : "third"} call`,

        performedBy: userId,
      });
    } else {
      // If not interested and max calls reached, drop candidate
      if (attemptNumber === 3) {
        await changeCandidateStatus(
          payload.candidateId,
          CANDIDATE_STATUS.DROPPED,
          userId,
          "Dropped after 3 unsuccessful call attempts"
        );
      }
      // Otherwise, candidate remains in their current status for follow-up calls
    }

    if (
      payload.interestStatus ===
      INTEREST_STATUS.NEEDS_FOLLOW_UP
    ) {
      await createNotification({
        userId,

        title:
          "Follow-up Required",

        message:
          "Candidate requires follow-up",

        type:
          "FOLLOW_UP",
      });
    }

    return call;
  };

export const getTodayFollowUps = async () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return Call.find({
    followUpDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).populate("candidateId");
};

export const getUpcomingFollowUps = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return Call.find({
    followUpDate: {
      $gte: tomorrow,
    },
  })
    .populate("candidateId")
    .sort({ followUpDate: 1 });
};