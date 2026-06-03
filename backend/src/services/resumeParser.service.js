import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Service for parsing PDF resumes
 * Extracts text content from PDF files
 */
export const resumeParserService = {
  /**
   * Ensure upload directory exists
   * @returns {void}
   */
  async ensureUploadDirExists() {
    try {
      const uploadsDir = path.join(process.cwd(), "uploads", "resumes");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (error) {
      console.error("Error creating uploads directory:", error);
    }
  },

  /**
   * Parse PDF file and extract text content
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<string>} Extracted text content
   */
  async extractTextFromPDF(pdfBuffer) {
    try {
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("PDF buffer is empty");
      }

      const data = await pdfParse(pdfBuffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing error: ${error.message}`);
    }
  },

  /**
   * Save uploaded PDF file to disk
   * Returns relative path for database storage
   */
  async savePDFFile(buffer, fileName) {
    try {
      const uploadsDir = path.join(process.cwd(), "uploads", "resumes");

      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Write file
      fs.writeFileSync(filePath, buffer);

      // Return relative path for database
      return `/uploads/resumes/${uniqueFileName}`;
    } catch (error) {
      throw new Error(`Failed to save PDF: ${error.message}`);
    }
  },
};