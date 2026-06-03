import asyncHandler from "../../shared/utils/asyncHandler.js";
import { successResponse } from "../../shared/response/apiResponse.js";
import AppError from "../../shared/errors/AppError.js";
import { resumeParserService } from "../../services/resumeParser.service.js";
import { openaiResumeAnalyzerService } from "../../services/openaiResumeAnalyzer.service.js";
import Candidate from "./candidate.model.js";
import crypto from "crypto";
import { generateCandidateCode } from "../../shared/services/candidateCode.service.js";

/**
 * Upload and process multiple resume PDFs
 * Extracts text, analyzes with OpenAI, creates candidates
 */
export const uploadResumes = asyncHandler(async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    throw new AppError("No files provided", 400);
  }

  // Process each resume
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const file of files) {
    try {
      // 1. Parse PDF and extract text
      const resumeText = await resumeParserService.extractTextFromPDF(file.buffer);

      // 2. Analyze with OpenAI
      const analysis = await openaiResumeAnalyzerService.analyzeResume(resumeText);

      // 3. Check for duplicate by email
      if (analysis.email) {
        const existing = await Candidate.findOne({
          email: analysis.email.toLowerCase(),
        });

        if (existing) {
          results.push({
            name: analysis.name,
            email: analysis.email,
            code: existing.code,
            errors: ["Candidate with this email already exists"],
          });
          failedCount++;
          continue;
        }
      }

      // 4. Save PDF file
      const filePath = await resumeParserService.savePDFFile(file.buffer, file.originalname);

      // 5. Create candidate record
      const emailHash = analysis.email ? crypto.createHash("md5").update(analysis.email.toLowerCase()).digest("hex") : null;
      const candidateCode = await generateCandidateCode();

      const candidate = new Candidate({
        code: candidateCode,
        name: analysis.name || "Unknown Candidate",
        email: analysis.email || "",
        phone: analysis.phone || "",
        category: analysis.designation || "Imported from Resume",
        status: "NEW",
        resumeFilePath: filePath,
        aiAnalysis: {
          skills: Array.isArray(analysis.skills) ? analysis.skills : [],
          experienceYears: parseInt(analysis.experienceYears) || 0,
          education: analysis.education || "",
          currentCompany: analysis.currentCompany || "",
          designation: analysis.designation || "",
          location: analysis.location || "",
          summary: analysis.summary || "",
          resumeScore: parseInt(analysis.resumeScore) || 0,
          analyzedAt: new Date(),
        },
        emailHash,
      });

      await candidate.save();

      results.push({
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        code: candidate.code,
      });

      successCount++;
    } catch (error) {
      failedCount++;
      results.push({
        fileName: file.originalname,
        errors: [error.message],
      });
    }
  }

  return successResponse(
    res,
    {
      success: true,
      imported: successCount,
      failed: failedCount,
      candidates: results,
    },
    `${successCount} candidates imported successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}`
  );
});