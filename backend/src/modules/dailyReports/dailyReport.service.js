import DailyReport from "./dailyReport.model.js";
import Candidate from "../candidates/candidate.model.js";
import Call from "../calls/call.model.js";
import Interview from "../interviews/interview.model.js";

export const generateDailyReport = async (hrId) => {
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
    candidatesAssigned,
    candidatesCalled,
    interviewsScheduled,
    selectedCandidates,
    droppedCandidates,
    pendingCandidates,
  ] = await Promise.all([
    // Total candidates assigned to this HR
    Candidate.countDocuments({
      assignedHR: hrId,
      isDeleted: false,
    }),

    // Unique candidates called today by this HR
    Call.distinct("candidateId", {
      createdBy: hrId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).then((ids) => ids.length),

    // Interviews scheduled today by this HR
    Interview.countDocuments({
      scheduledBy: hrId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }),

    // Candidates selected (assigned to this HR)
    Candidate.countDocuments({
      assignedHR: hrId,
      status: "SELECTED",
    }),

    // Candidates dropped (assigned to this HR)
    Candidate.countDocuments({
      assignedHR: hrId,
      status: "DROPPED",
    }),

    // Pending candidates (not SELECTED and not DROPPED)
    Candidate.countDocuments({
      assignedHR: hrId,
      isDeleted: false,
      status: {
        $nin: ["SELECTED", "DROPPED"],
      },
    }),
  ]);

  // Upsert: update if a report for today already exists, otherwise create
  const report = await DailyReport.findOneAndUpdate(
    {
      hrId,
      reportDate: startOfDay,
    },
    {
      candidatesAssigned,
      candidatesCalled,
      interviewsScheduled,
      selectedCandidates,
      droppedCandidates,
      pendingCandidates,
    },
    {
      upsert: true,
      new: true,
    }
  );

  return report;
};

export const getMyReports = async (hrId) => {
  return DailyReport.find({ hrId })
    .sort({ reportDate: -1 });
};
