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
      const doneStatus =
        attemptNumber === 1
          ? CANDIDATE_STATUS.FIRST_CALL_DONE
          : attemptNumber === 2
          ? CANDIDATE_STATUS.SECOND_CALL_DONE
          : CANDIDATE_STATUS.THIRD_CALL_DONE;

      await changeCandidateStatus(
        payload.candidateId,
        doneStatus,
        userId,
        "Candidate interested"
      );
    } else {
      if (attemptNumber === 1) {
        await changeCandidateStatus(
          payload.candidateId,
          CANDIDATE_STATUS.SECOND_CALL_PENDING,
          userId,
          "First call attempt logged"
        );
      } else if (attemptNumber === 2) {
        await changeCandidateStatus(
          payload.candidateId,
          CANDIDATE_STATUS.THIRD_CALL_PENDING,
          userId,
          "Second call attempt logged"
        );
      } else if (
        attemptNumber === 3 &&
        payload.outcome === CALL_OUTCOMES.NOT_PICKED
      ) {
        await changeCandidateStatus(
          payload.candidateId,
          CANDIDATE_STATUS.DROPPED,
          userId,
          "Call Not Picked"
        );
      }
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