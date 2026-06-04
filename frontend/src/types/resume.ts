/**
 * Resume Upload and AI Analysis Types
 */

/**
 * AI-extracted resume data structure returned by Gemini API
 */
export interface AIResumeAnalysis {
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experienceYears: number;
  education: string | null;
  currentCompany: string | null;
  designation: string | null;
  location: string | null;
  summary: string;
  resumeScore: number;
}

/**
 * Single candidate result from resume upload
 */
export interface ResumeUploadCandidate {
  id: string;
  name: string;
  email: string;
  code: string;
  resumePath?: string;
  error?: string;
}

/**
 * Error result from resume upload
 */
export interface ResumeUploadError {
  fileName: string;
  error: string;
}

/**
 * Response from backend resume upload endpoint
 * POST /api/candidates/upload-resumes
 */
export interface ResumeUploadResponse {
  success: boolean;
  imported: number;
  duplicates: number;
  failed: number;
  candidates: ResumeUploadCandidate[];
  message?: string;
}

/**
 * Resume file with metadata for tracking during upload
 */
export interface ResumeFile {
  file: File;
  id: string; // unique id for tracking during upload
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

/**
 * Upload progress state
 */
export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  message: string;
}
