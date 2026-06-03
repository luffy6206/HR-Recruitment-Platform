/**
 * Resume Upload Controller
 * 
 * Handles:
 * - Multiple PDF file upload
 * - PDF text extraction
 * - OpenAI analysis
 * - Candidate creation from analyzed data
 */

import Candidate from './candidate.model.js';
import { extractTextFromMultiplePDFs } from '../../services/resumeParser.service.js';
import { analyzeMultipleResumesWithOpenAI } from '../../services/openaiResumeAnalyzer.service.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import AppError from '../../shared/errors/AppError.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

/**
 * Generate next candidate code
 */
const generateCandidateCode = async () => {
  const count = await Candidate.countDocuments();
  return `CAN-${String(1000 + count + 1)}`;
};

/**
 * Generate unique file path for resume
 */
const generateResumePath = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  return `resumes/${timestamp}-${uuid}${ext}`;
};

/**
 * POST /api/candidates/upload-resumes
 * 
 * Upload and process multiple resumes
 * Extracts text, analyzes with OpenAI, creates candidates
 */
export const uploadResumes = asyncHandler(async (req, res) => {
  // Validate files
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadedFiles = req.files;

  // Step 1: Extract text from PDFs
  const extractedTexts = await extractTextFromMultiplePDFs(
    uploadedFiles.map((f) => ({
      originalname: f.originalname,
      buffer: f.buffer,
    }))
  );

  // Separate valid extractions from errors
  const validTexts = extractedTexts
    .filter((r) => !r.error)
    .map((r) => r.text);

  if (validTexts.length === 0) {
    throw new AppError('No valid PDF files could be extracted', 400);
  }

  // Step 2: Analyze with OpenAI
  const analyzedResumes = await analyzeMultipleResumesWithOpenAI(validTexts);

  // Step 3: Create candidates and track results
  const createdCandidates = [];
  const errors = [];

  for (let i = 0; i < analyzedResumes.length; i++) {
    const result = analyzedResumes[i];
    const file = uploadedFiles[i];

    if ('error' in result) {
      errors.push({
        fileName: file.originalname,
        error: result.error,
      });
      continue;
    }

    try {
      const { analysis } = result;

      // Check for duplicate by email (if email exists)
      if (analysis.email) {
        const existing = await Candidate.findOne({
          email: analysis.email,
          isDeleted: false,
        });

        if (existing) {
          errors.push({
            fileName: file.originalname,
            error: `Candidate with email ${analysis.email} already exists`,
          });
          continue;
        }
      }

      // Generate unique candidate code
      const candidateCode = await generateCandidateCode();

      // Generate resume file path
      const resumeFilePath = generateResumePath(file.originalname);

      // Create candidate record
      const candidate = new Candidate({
        candidateCode,
        fullName: analysis.name || 'Unknown',
        email: analysis.email || null,
        phone: analysis.phone || null,
        category: analysis.designation || 'General', // Use designation as category if available
        source: 'AI_RESUME_UPLOAD',
        resumeFilePath,
        resumeAnalysis: {
          skills: analysis.skills,
          experienceYears: analysis.experienceYears,
          education: analysis.education,
          currentCompany: analysis.currentCompany,
          designation: analysis.designation,
          location: analysis.location,
          summary: analysis.summary,
          resumeScore: analysis.resumeScore,
          analyzedAt: new Date(),
        },
        uploadInfo: {
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
        },
      });

      await candidate.save();

      createdCandidates.push({
        id: candidate._id,
        name: candidate.fullName,
        email: candidate.email,
        resumePath: resumeFilePath,
        code: candidateCode,
      });
    } catch (err) {
      errors.push({
        fileName: file.originalname,
        error: err?.message ?? 'Failed to create candidate',
      });
    }
  }

  // Return response
  res.status(200).json({
    success: true,
    imported: createdCandidates.length,
    candidates: createdCandidates,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      total: uploadedFiles.length,
      successful: createdCandidates.length,
      failed: errors.length,
    },
  });
});
