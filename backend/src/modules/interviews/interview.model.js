import mongoose from "mongoose";

const interviewSchema =
  new mongoose.Schema(
    {
      candidateId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Candidate",

        required: true,
      },

      scheduledBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      interviewerName: {
        type: String,

        required: true,
      },

      interviewType: {
        type: String,

        enum: [
          "HR",
          "TECHNICAL",
          "MANAGERIAL",
          "FINAL",
        ],

        required: true,
      },

      scheduledAt: {
        type: Date,

        required: true,
      },

      meetingLink: String,

      status: {
        type: String,

        enum: [
          "SCHEDULED",
          "COMPLETED",
          "CANCELLED",
          "NO_SHOW",
        ],

        default:
          "SCHEDULED",
      },

      feedback: String,

      rating: {
        type: Number,

        min: 1,

        max: 10,
      },

      decision: {
        type: String,
        enum: ["SELECT", "TASK", "DROP"],
      },

      decisionReason: String,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Interview",
  interviewSchema
);