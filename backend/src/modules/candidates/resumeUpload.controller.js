import asyncHandler from "../../shared/utils/asyncHandler.js";
import { successResponse, errorResponse } from "../../shared/response/apiResponse.js";
import AppError from "../../shared/errors/AppError.js";
import { resumeParserService } from "../../services/resumeParser.service.js";
import { fallbackParseResume } from "../../services/resumeFallbackParser.js";
import { createCandidate, findDuplicateCandidate } from "./candidate.service.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { updateProfileFromResume } from "../ai/profileUpdater.service.js";
import { createNotification } from "../notifications/notification.service.js";
import User from "../auth/auth.model.js";
/**
 * Upload and process multiple resume files
 * Extracts text, parses with regex, creates candidates
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

  // Extract and validate category and assignedHR
  const { category, assignedHR } = req.body;
  
  if (!category || !category.trim()) {
    throw new AppError("Category is required", 400);
  }

  if (!assignedHR || !assignedHR.trim()) {
    throw new AppError("Assigned HR is required", 400);
  }

  const files = Array.isArray(req.files)
    ? req.files
    : req.file
      ? [req.file]
      : [];

  if (!files || files.length === 0) {
    throw new AppError("No files provided", 400);
  }

  const results = [];
  const importedCandidates = [];
  let successCount = 0;
  let failedCount = 0;
  let duplicateCount = 0;

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

      const analysis = fallbackParseResume(resumeText);
      uploadLog.stages.push({ stage: 'regex_parsing', file: file.originalname });

      const safeName = analysis.name?.trim() || "Unknown Candidate";
      let safeEmail = analysis.email
        ? analysis.email.toLowerCase().trim()
        : `unknown-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
      let safePhone = analysis.phone?.trim() || "000-000-0000";

      console.log(
        `[UPLOAD] Resolved candidate info: ${safeName}, ${safeEmail}, ${safePhone ?? "<none>"}`
      );
      fileLog.resolved = { name: safeName, email: safeEmail, phone: safePhone };

      const candidatePayload = {
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        category: category.trim(), // Use category from request
        assignedHR: assignedHR.trim(), // Store assignedHR ID
        status: "NEW",
        source: "RESUME",
        aiAnalysis: {
          skills: Array.isArray(analysis.skills) ? analysis.skills : [],
          experienceYears: Math.max(0, parseInt(analysis.experienceYears) || 0),
          education:
            Array.isArray(analysis.education)
              ? JSON.stringify(analysis.education)
              : analysis.education || "",
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

      console.log("[DUPLICATE CHECK START]");
      console.log("Candidate email:", candidatePayload.email);
      console.log("Candidate phone:", candidatePayload.phone);

      const existingCandidate = await findDuplicateCandidate({
        email: candidatePayload.email,
        phone: candidatePayload.phone,
      });

      console.log("Existing candidate:", existingCandidate?._id?.toString() ?? null);

      if (existingCandidate && process.env.SKIP_DUPLICATE_CHECK !== 'true') {
        console.log(
          `[DUPLICATE CHECK] email: ${candidatePayload.email}, phone: ${candidatePayload.phone ?? "<none>"}, existing candidate id: ${existingCandidate._id}`
        );

        duplicateCount++;
        uploadLog.stages.push({
          stage: 'duplicate_check',
          file: file.originalname,
          email: candidatePayload.email,
          phone: candidatePayload.phone || null,
          existingCandidateId: existingCandidate._id.toString(),
        });

        fileLog.duplicate = {
          existingCandidateId: existingCandidate._id.toString(),
          email: existingCandidate.email,
          phone: existingCandidate.phone,
        };

        results.push({
          fileName: file.originalname,
          duplicate: true,
          existingCandidateId: existingCandidate._id.toString(),
          email: existingCandidate.email,
          phone: existingCandidate.phone,
        });

        uploadLog.files = uploadLog.files.map((f) =>
          f.fileName === file.originalname ? { ...f, ...fileLog } : f
        );

        continue;
      }

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

      importedCandidates.push({
        id: candidate._id,
        name: candidate.name
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

  // Send notification for successful assignments
  if (successCount > 0) {
    try {
      const performer = await User.findById(req.user.id);
      const performerName = performer?.name || "System Admin";

      if (successCount === 1) {
        await createNotification({
          userId: assignedHR.trim(),
          title: "1 New Candidate Assigned",
          message: `${importedCandidates[0].name} assigned to you by ${performerName}`,
          type: "ASSIGNMENT",
          metadata: {
            candidateId: importedCandidates[0].id,
            candidateName: importedCandidates[0].name,
          },
        });
      } else {
        await createNotification({
          userId: assignedHR.trim(),
          title: `${successCount} New Candidates Assigned`,
          message: `${successCount} candidates assigned to you by ${performerName}`,
          type: "ASSIGNMENT",
          metadata: {
            candidateIds: importedCandidates.map((c) => c.id),
            candidateNames: importedCandidates.map((c) => c.name),
          },
        });
      }
      console.log(`[UPLOAD] Notification sent to HR ${assignedHR} for ${successCount} candidates`);
    } catch (notifError) {
      console.error("[UPLOAD] Failed to send notification:", notifError);
    }
  }

  const responseData = {
    imported: successCount,
    duplicates: duplicateCount,
    failed: failedCount,
    candidates: results,
  };

  // Attach detailed upload log (always in dev runs)
  responseData.uploadLog = uploadLog;

  const duplicateOnlyUpload = successCount === 0 && failedCount === 0 && duplicateCount > 0;

  if (duplicateOnlyUpload) {
    return successResponse(
      res,
      responseData,
      `No new candidates were imported. ${failedCount} resume${failedCount === 1 ? "" : "s"
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

  const messageParts = [];
  if (successCount > 0) {
    messageParts.push(
      `${successCount} candidate${successCount === 1 ? "" : "s"} imported successfully`
    );
  }
  if (duplicateCount > 0) {
    messageParts.push(
      `${duplicateCount} duplicate resume${duplicateCount === 1 ? "" : "s"} skipped`
    );
  }
  if (failedCount > 0) {
    messageParts.push(
      `${failedCount} resume${failedCount === 1 ? "" : "s"} failed`
    );
  }

  return successResponse(
    res,
    responseData,
    messageParts.join(", ")
  );

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
    `${successCount} candidate${successCount === 1 ? "" : "s"} imported successfully${failedCount > 0 ? `, ${failedCount} failed` : ""
    }`
  );
});