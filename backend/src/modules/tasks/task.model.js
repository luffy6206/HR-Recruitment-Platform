import mongoose from "mongoose";

const taskSchema =
  new mongoose.Schema(
    {
      candidateId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
        required: true,
      },

      assignedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      description: String,

      deadline: Date,

      submissionLink: String,

      status: {
        type: String,
        enum: [
          "ASSIGNED",
          "SUBMITTED",
          "REVIEWED",
          "PASSED",
          "FAILED",
        ],
        default: "ASSIGNED",
      },

      reviewNotes: String,

        // Re-task reference (points to original task if this is a re-task)
        reTaskOf: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
          default: null,
        },

        // Review outcome after submission
        reviewOutcome: {
          type: String,
          enum: ["SATISFIED", "NEEDS_IMPROVEMENT", "FAILED"],
        },

        // Reason for failure or rework request
        reviewReason: String,

      score: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Task",
  taskSchema
);