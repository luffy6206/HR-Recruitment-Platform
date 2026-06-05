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

      education: Array,

      skills: Array,

      inferredSkills: Array,

      experience: Array,

      projects: Array,

      certifications: Array,

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