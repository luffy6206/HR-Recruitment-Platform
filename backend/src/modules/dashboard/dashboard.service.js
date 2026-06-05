import Candidate from "../candidates/candidate.model.js";

import Call from "../calls/call.model.js";

import Interview from "../interviews/interview.model.js";

import Task from "../tasks/task.model.js";

import {
  CANDIDATE_STATUS,
} from "../../constants/candidateStatus.js";

export const getDashboardData =
  async () => {
    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23, 59, 59
    );

    const [
      totalCandidates,
      firstCallPending,
      secondCallPending,
      thirdCallPending,
      followUpsToday,
      interviewsToday,
      tasksToReview,
      selectedCandidates,
      droppedCandidates,
    ] = await Promise.all([
      Candidate.countDocuments({
        isDeleted: false,
      }),

      Candidate.countDocuments({
        status: CANDIDATE_STATUS.FIRST_CALL_PENDING,
      }),

      Candidate.countDocuments({
        status: CANDIDATE_STATUS.SECOND_CALL_PENDING,
      }),

      Candidate.countDocuments({
        status: CANDIDATE_STATUS.THIRD_CALL_PENDING,
      }),

      Call.countDocuments({
        followUpDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      Interview.countDocuments({
        scheduledAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: "SCHEDULED",
      }),

      Task.countDocuments({
        status: "SUBMITTED",
      }),

      Candidate.countDocuments({
        status: CANDIDATE_STATUS.SELECTED,
      }),

      Candidate.countDocuments({
        status: CANDIDATE_STATUS.DROPPED,
      }),
    ]);

    return {
      totalCandidates,
      firstCallPending,
      secondCallPending,
      thirdCallPending,
      followUpsToday,
      interviewsToday,
      tasksToReview,
      selectedCandidates,
      droppedCandidates,
    };
  };