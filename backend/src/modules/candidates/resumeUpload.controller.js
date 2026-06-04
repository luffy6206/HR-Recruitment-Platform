import asyncHandler from "../../shared/utils/asyncHandler.js";
import { successResponse, errorResponse } from "../../shared/response/apiResponse.js";
import AppError from "../../shared/errors/AppError.js";
import { resumeParserService } from "../../services/resumeParser.service.js";
import { openaiResumeAnalyzerService } from "../../services/openaiResumeAnalyzer.service.js";
import { createCandidate } from "./candidate.service.js";
import { updateProfileFromResume } from "../ai/profileUpdater.service.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/**
 * Upload and process multiple resume files
 * Extracts text, analyzes with Gemini, creates candidates
 */
export const uploadResumes = asyncHandler(async (req, res) => {
  console.log("[UPLOAD] Upload request received");
  const uploadLog = {
    timestamp: new Date().toISOString(),
    files: [],
    stages: [],
  };
  console.log("[UPLOAD] Body:", req.body);
  console.log(
    "[UPLOAD] Files:",
    Array.isArray(req.files)
      ? req.files.map((file) => ({
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        }))
      : req.files
  );
  console.log(
    "[UPLOAD] File property:",
    req.file
      ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null
  );

  const files = Array.isArray(req.files)
    ? req.files
    : req.file
    ? [req.file]
    : [];

  if (!files || files.length === 0) {
    throw new AppError("No files provided", 400);
  }

  await resumeParserService.ensureUploadDirExists();

  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const file of files) {
    try {
      const fileLog = { fileName: file.originalname };
      console.log(
        `[UPLOAD] Received file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`
      );
      uploadLog.files.push({ fileName: file.originalname, mimeType: file.mimetype, size: file.size });

      const resumeText = await resumeParserService.extractTextFromFile(
        file.buffer,
        file.mimetype,
        file.originalname
      );

      console.log(
        `[UPLOAD] Extracted resume text for ${file.originalname}: ${resumeText.length} chars`
      );
      console.log(
        `[UPLOAD] Resume preview: ${resumeText
          .slice(0, 300)
          .replace(/\n/g, " ")}`
      );
      fileLog.extracted = { length: resumeText.length, preview: resumeText.slice(0, 300) };
      uploadLog.stages.push({ stage: 'pdf_extraction', file: file.originalname, length: resumeText.length });

      const analysis = await openaiResumeAnalyzerService.analyzeResume(resumeText);
      // capture AI analysis summary if available
      uploadLog.stages.push({ stage: 'ai_analysis', file: file.originalname, model: analysis?.model || null, promptPreview: analysis?.promptPreview || null, raw: analysis?.raw || null });

      const safeName = analysis.name?.trim() || "Unknown Candidate";
      const safeEmail = analysis.email
        ? analysis.email.toLowerCase().trim()
        : `unknown-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
      const safePhone = analysis.phone?.trim() || "000-000-0000";

      console.log(
        `[UPLOAD] Resolved candidate info: ${safeName}, ${safeEmail}, ${safePhone}`
      );
      fileLog.resolved = { name: safeName, email: safeEmail, phone: safePhone };

      const filePath = await resumeParserService.saveResumeFile(
        file.buffer,
        file.originalname
      );
      fileLog.savedPath = filePath;

      const candidatePayload = {
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        category: analysis.designation || "Imported from Resume",
        status: "NEW",
        source: "RESUME",
        resumeFilePath: filePath,
        aiAnalysis: {
          skills: Array.isArray(analysis.skills) ? analysis.skills : [],
          experienceYears: Math.max(0, parseInt(analysis.experienceYears) || 0),
          education: analysis.education || "",
          currentCompany: analysis.currentCompany || "",
          designation: analysis.designation || "",
          location: analysis.location || "",
          summary: analysis.summary || "",
          resumeScore: Math.min(100, Math.max(0, parseInt(analysis.resumeScore) || 0)),
          confidenceScores: analysis.confidenceScores || {},
          analyzedAt: new Date(),
        },
        emailHash: analysis.email
          ? crypto.createHash("md5").update(analysis.email.toLowerCase()).digest("hex")
          : null,
      };

      console.log(`[UPLOAD] Candidate insert starting for ${safeName}`);
      uploadLog.stages.push({ stage: 'candidate_mapping', file: file.originalname, payload: candidatePayload });
      const candidate = await createCandidate(candidatePayload, req.user.id);
      console.log(
        `[UPLOAD] Candidate insert success: ${candidate._id} (${candidate.name})`
      );
      fileLog.insert = { id: candidate._id.toString(), code: candidate.code };
      uploadLog.stages.push({ stage: 'candidate_insert', file: file.originalname, id: candidate._id.toString(), code: candidate.code });

      console.log(`[UPLOAD] Updating candidate profile for ${safeName}`);
      await updateProfileFromResume(candidate._id, analysis);
      uploadLog.stages.push({ stage: 'profile_update', file: file.originalname, id: candidate._id.toString() });

      results.push({
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        code: candidate.code,
      });
      // attach fileLog to results for later persistence
      fileLog.result = { id: candidate._id.toString(), name: candidate.name, email: candidate.email, code: candidate.code };
      uploadLog.files = uploadLog.files.map(f => f.fileName === file.originalname ? { ...f, ...fileLog } : f);

      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upload error";
      console.error(
        `[UPLOAD] Failed processing ${file?.originalname ?? "unknown file"}: ${message}`,
        error
      );
      uploadLog.files = uploadLog.files.map(f => f.fileName === file?.originalname ? { ...f, errors: [message] } : f);
      failedCount++;
      results.push({
        fileName: file.originalname,
        errors: [message],
      });
    }
  }

  const responseData = {
    imported: successCount,
    failed: failedCount,
    candidates: results,
  };

  // Attach detailed upload log (always in dev runs)
  responseData.uploadLog = uploadLog;

  const isDuplicateOnlyUpload =
    successCount === 0 &&
    failedCount > 0 &&
    results.every(
      (result) =>
        result.errors?.length === 1 &&
        result.errors[0] === "Candidate already exists"
    );

  if (isDuplicateOnlyUpload) {
    return successResponse(
      res,
      responseData,
      `No new candidates were imported. ${failedCount} resume${
        failedCount === 1 ? "" : "s"
      } matched existing candidate records.`
    );
  }

  if (successCount === 0) {
    return errorResponse(
      res,
      "No candidates were imported. Check the upload errors and try again.",
      400,
      responseData
    );
  }

  // persist upload log for traceability
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    const outPath = path.join(logsDir, `upload-${Date.now()}.json`);
    await fs.writeFile(outPath, JSON.stringify(uploadLog, null, 2), 'utf8');
    console.log('[UPLOAD] Detailed upload log written to', outPath);
  } catch (e) {
    console.error('[UPLOAD] Failed to write upload log', e);
  }

  return successResponse(
    res,
    responseData,
    `${successCount} candidate${successCount === 1 ? "" : "s"} imported successfully${
      failedCount > 0 ? `, ${failedCount} failed` : ""
    }`
  );
});