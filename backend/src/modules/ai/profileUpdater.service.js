import CandidateProfile
from "../profiles/candidateProfile.model.js";

export const updateProfileFromResume =
  async (
    candidateId,
    extractedData
  ) => {
    return CandidateProfile.findOneAndUpdate(
      {
        candidateId,
      },
      {
        skills:
          extractedData.skills,

        education:
          extractedData.education,

        experience:
          extractedData.experience,
          
        projects:
          extractedData.projects,
          
        certifications:
          extractedData.certifications,
          
        linkedin:
          extractedData.linkedin,
          
        github:
          extractedData.github,
      },
      {
        new: true,
      }
    );
  };