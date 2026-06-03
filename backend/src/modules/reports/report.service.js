import Candidate from "../candidates/candidate.model.js";

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
    return Candidate.aggregate([
      {
        $match: {
          isDeleted: false,
          assignedHR: {
            $exists: true,
          },
        },
      },

      {
        $group: {
          _id: "$assignedHR",

          totalCandidates: {
            $sum: 1,
          },
        },
      },

      {
        $lookup: {
          from: "users",

          localField: "_id",

          foreignField: "_id",

          as: "hr",
        },
      },
    ]);
  };