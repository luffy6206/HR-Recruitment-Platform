import mongoose from "mongoose";

const candidateProfileSchema =
  new mongoose.Schema(
    {
      candidateId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Candidate",

        required: true,
      },

      location: String,

      linkedin: String,

      github: String,

      education: {
        type: Array,
        default: [],
      },

      skills: {
        type: Array,
        default: [],
      },

      inferredSkills: {
        type: Array,
        default: [],
      },

      experience: {
        type: Array,
        default: [],
      },

      projects: {
        type: Array,
        default: [],
      },

      certifications: {
        type: Array,
        default: [],
      },

      technicalTraining: {
        completed: {
          type: Boolean,
          default: false,
        },
        trainingName: String,
        institute: String,
        duration: String,
        completionYear: Number,
      },

      currentLocation: {
        type: String,
        default: null,
      },

      permanentLocation: {
        type: String,
        default: null,
      },

      passingYear: Number,

      candidateType: {
        type: String,
        enum: ["PASSOUT", "STUDENT"],
      },

      academicYear: {
        type: String,
        default: null,
      },

      cgpa: Number,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "CandidateProfile",
  candidateProfileSchema
);