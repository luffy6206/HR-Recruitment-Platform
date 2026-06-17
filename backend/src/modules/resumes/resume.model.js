import mongoose from "mongoose";

const resumeSchema =
  new mongoose.Schema(
    {
      candidateId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Candidate",

        required: true,
      },

      originalFileName: {
        type: String,

        required: true,
      },

      fileUrl: {
        type: String,
        default: null,
      },

      fileSize: Number,

      mimeType: String,

      uploadedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      processingStatus: {
        type: String,

        enum: [
          "PENDING",
          "PROCESSING",
          "COMPLETED",
          "FAILED",
        ],

        default: "PENDING",
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Resume",
  resumeSchema
);