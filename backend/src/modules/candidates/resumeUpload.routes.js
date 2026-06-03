import express from "express";
import multer from "multer";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import * as controller from "./resumeUpload.controller.js";

const router = express.Router();

// Configure multer for in-memory PDF storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

/**
 * POST /api/candidates/upload-resumes
 * Upload multiple resume PDFs
 * Protected: Requires ADMIN or HR role
 */
router.post(
  "/upload-resumes",
  protect,
  authorize(ROLES.ADMIN, ROLES.HR),
  upload.array("resumes", 50), // Max 50 files
  controller.uploadResumes
);

export default router;