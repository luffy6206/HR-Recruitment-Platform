import express from "express";
import multer from "multer";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import * as controller from "./resumeUpload.controller.js";

const router = express.Router();

// Configure multer for in-memory resume storage
const supportedMimeTypes = new Set([
  "application/pdf",
  "application/octet-stream",
  "application/x-pdf",
  "application/vnd.adobe.pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-office",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isSupported = supportedMimeTypes.has(file.mimetype);
    const extension = file.originalname.toLowerCase().split(".").pop();

    if (isSupported || extension === "pdf" || extension === "docx" || extension === "doc") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"), false);
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
  upload.array("resumes", 10),
  controller.uploadResumes
);

export default router;