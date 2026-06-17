import mongoose from "mongoose";

import {
  STATUS_VALUES,
} from "../../constants/candidateStatus.js";

const candidateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
    },

    phone: String,

    category: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      default: "MANUAL",
    },

    assignedHR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "NEW",
    },

    uploadInfo: {
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      uploadedAt: Date,
    },

    droppedInfo: {
      reason: String,

      note: String,

      droppedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      droppedAt: Date,
    },

    selectedInfo: {
      joiningDate: Date,

      package: Number,

      notes: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Legacy candidate code field (kept for compatibility with older indexes)
    candidateCode: {
      type: String,
      default: null,
    },

    // AI Analysis
    aiAnalysis: {
      skills: [String],

      experienceYears: Number,

      education: String,

      currentCompany: String,

      designation: String,

      location: String,

      summary: String,

      resumeScore: {
        type: Number,
        min: 0,
        max: 100,
      },

      confidenceScores: {
        type: Map,
        of: Number,
      },

      analyzedAt: Date,
    },

    // New call workflow fields
    linedUp: {
      type: Boolean,
      default: false,
      index: true,
    },

    fitment: {
      type: String,
      enum: ["Fit", "Not Fit"],
      default: null,
    },

    interestStatus: {
      type: String,
      enum: ["Interested", "Not Interested", "Will Think", "Will Call Back", null],
      default: null,
    },

    dropReason: {
      type: String,
      default: null,
    },

    callHistory: [
      {
        callNumber: Number,
        outcome: String,
        interestedStatus: String,
        fitment: String,
        notes: String,
        hr: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        calledAt: Date,
      },
    ],

    // Duplicate detection
    emailHash: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

candidateSchema.index({
  email: 1,
}, {
  unique: true,
  partialFilterExpression: {
    isDeleted: false,
    email: { $type: "string" },
  },
});

candidateSchema.index({
  phone: 1,
}, {
  unique: true,
  partialFilterExpression: {
    isDeleted: false,
    phone: { $type: "string" },
  },
});

candidateSchema.index({
  emailHash: 1,
}, {
  sparse: true,
  partialFilterExpression: {
    isDeleted: false,
    emailHash: { $type: "string" },
  },
});

candidateSchema.index({
  assignedHR: 1,
});

candidateSchema.index({
  status: 1,
});

export default mongoose.model(
  "Candidate",
  candidateSchema
);