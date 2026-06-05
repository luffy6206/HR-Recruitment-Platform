import Candidate from "../candidates/candidate.model.js";
import Call from "../calls/call.model.js";
import Interview from "../interviews/interview.model.js";

export const getStatusDistribution =
  async () => {
    return Candidate.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },

      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);
  };

export const getCandidateSummary =
  async () => {
    const totalCandidates =
      await Candidate.countDocuments({
        isDeleted: false,
      });

    const selectedCandidates =
      await Candidate.countDocuments({
        status: "SELECTED",
      });

    const droppedCandidates =
      await Candidate.countDocuments({
        status: "DROPPED",
      });

    return {
      totalCandidates,
      selectedCandidates,
      droppedCandidates,
    };
  };

export const getHRPerformance =
  async () => {
    // Get all candidates grouped by assignedHR
    const candidateStats = await Candidate.aggregate([
      {
        $match: {
          isDeleted: false,
          assignedHR: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$assignedHR",
          candidatesAssigned: { $sum: 1 },
          selectedCandidates: {
            $sum: {
              $cond: [{ $eq: ["$status", "SELECTED"] }, 1, 0],
            },
          },
          droppedCandidates: {
            $sum: {
              $cond: [{ $eq: ["$status", "DROPPED"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "hrUser",
        },
      },
      {
        $unwind: "$hrUser",
      },
    ]);

    // Get call counts per HR (createdBy)
    const callStats = await Call.aggregate([
      {
        $group: {
          _id: "$createdBy",
          candidatesCalled: { $addToSet: "$candidateId" },
          followUpsCompleted: {
            $sum: {
              $cond: [
                { $ne: ["$followUpDate", null] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          candidatesCalled: { $size: "$candidatesCalled" },
          followUpsCompleted: 1,
        },
      },
    ]);

    // Get interview counts per HR (scheduledBy)
    const interviewStats = await Interview.aggregate([
      {
        $group: {
          _id: "$scheduledBy",
          interviewsScheduled: { $sum: 1 },
        },
      },
    ]);

    // Build lookup maps
    const callMap = {};
    for (const c of callStats) {
      callMap[c._id.toString()] = c;
    }

    const interviewMap = {};
    for (const i of interviewStats) {
      interviewMap[i._id.toString()] = i;
    }

    // Merge results
    return candidateStats.map((hr) => {
      const hrId = hr._id.toString();
      const calls = callMap[hrId] || {};
      const interviews = interviewMap[hrId] || {};

      return {
        hrId: hr._id,
        hrName: hr.hrUser.name,
        candidatesAssigned: hr.candidatesAssigned,
        candidatesCalled: calls.candidatesCalled || 0,
        interviewsScheduled: interviews.interviewsScheduled || 0,
        selectedCandidates: hr.selectedCandidates,
        droppedCandidates: hr.droppedCandidates,
        followUpsCompleted: calls.followUpsCompleted || 0,
      };
    });
  };