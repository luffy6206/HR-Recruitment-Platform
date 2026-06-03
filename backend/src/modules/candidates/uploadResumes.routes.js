/**
 * Resume Upload Routes
 * 
 * POST /api/candidates/upload-resumes - Upload and process multiple resume PDFs
 */

import express from 'express';
import multer from 'multer';
import protect from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as controller from './uploadResumes.controller.js';

const router = express.Router();

// Multer memory storage for file uploads
// Files are stored in memory and processed directly
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
  },
});

/**
 * POST /api/candidates/upload-resumes
 * 
 * Upload multiple PDF resumes for automatic candidate creation
 * - Requires authentication
 * - Requires ADMIN or HR role
 * - Accepts multipart/form-data with multiple PDF files under 'resumes' field
 * 
 * Response:
 * {
 *   success: boolean,
 *   imported: number,
 *   candidates: Array,
 *   errors: Array (optional),
 *   summary: { total, successful, failed }
 * }
 */
router.post(
  '/upload-resumes',
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  upload.array('resumes', 50), // Max 50 files per upload
  controller.uploadResumes
);

export default router;
