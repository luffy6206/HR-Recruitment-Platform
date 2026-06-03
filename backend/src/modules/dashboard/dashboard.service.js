import Candidate from "../candidates/candidate.model.js";

import Call from "../calls/call.model.js";

import {
  CANDIDATE_STATUS,
} from "../../constants/candidateStatus.js";

export const getDashboardData =
  async () => {
    const today =
      new Date();

    const startOfDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

    const endOfDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      );

    const [
      totalCandidates,

      contactedCandidates,

      selectedCandidates,

      droppedCandidates,

      followUpsToday,
    ] = await Promise.all([
      Candidate.countDocuments({
        isDeleted: false,
      }),

      Candidate.countDocuments({
        status:
          CANDIDATE_STATUS.CONTACTED,
      }),

      Candidate.countDocuments({
        status:
          CANDIDATE_STATUS.SELECTED,
      }),

      Candidate.countDocuments({
        status:
          CANDIDATE_STATUS.DROPPED,
      }),

      Call.countDocuments({
        followUpDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),
    ]);

    return {
      totalCandidates,

      contactedCandidates,

      selectedCandidates,

      droppedCandidates,

      followUpsToday,
    };
  };