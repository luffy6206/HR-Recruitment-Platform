import Candidate from "../candidates/candidate.model.js";

export const globalSearch =
  async (query) => {
    return Candidate.find({
      isDeleted: false,

      $or: [
        {
          name: {
            $regex: query,
            $options: "i",
          },
        },

        {
          email: {
            $regex: query,
            $options: "i",
          },
        },

        {
          phone: {
            $regex: query,
            $options: "i",
          },
        },

        {
          category: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    })
      .limit(20)
      .sort({
        createdAt: -1,
      });
  };