import mongoose from "mongoose";

const dailyReportSchema = new mongoose.Schema(
  {
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reportDate: {
      type: Date,
      required: true,
    },

    candidatesAssigned: {
      type: Number,
      default: 0,
    },

    candidatesCalled: {
      type: Number,
      default: 0,
    },

    interviewsScheduled: {
      type: Number,
      default: 0,
    },

    selectedCandidates: {
      type: Number,
      default: 0,
    },

    droppedCandidates: {
      type: Number,
      default: 0,
    },

    pendingCandidates: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one report per HR per day
dailyReportSchema.index(
  { hrId: 1, reportDate: 1 },
  { unique: true }
);

export default mongoose.model(
  "DailyReport",
  dailyReportSchema
);
