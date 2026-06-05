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
        location:
          extractedData.location,

        skills:
          extractedData.skills,

        inferredSkills:
          extractedData.inferredSkills,

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