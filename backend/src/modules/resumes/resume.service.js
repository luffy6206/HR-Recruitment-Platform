import Resume from "./resume.model.js";

import Candidate from "../candidates/candidate.model.js";

import AppError from "../../shared/errors/AppError.js";

export const uploadResume =
  async (
    candidateId,
    file,
    userId
  ) => {
    const candidate =
      await Candidate.findById(
        candidateId
      );

    if (!candidate) {
      throw new AppError(
        "Candidate not found",
        404
      );
    }

    const resume =
      await Resume.create({
        candidateId,

        originalFileName:
          file.originalname,

        fileSize:
          file.size,

        mimeType:
          file.mimetype,

        uploadedBy:
          userId,
      });

    return resume;
  };