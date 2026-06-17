import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const PDFParse = pdfParseModule.PDFParse || pdfParseModule;

const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/octet-stream",
  "application/x-pdf",
  "application/vnd.adobe.pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-office",
]);

/**
 * Service for parsing resume files
 * Extracts text content from memory buffers
 */
export const resumeParserService = {
  /**
   * Extract text from an uploaded resume file
   * Supports PDF and DOCX files
   */
  async extractTextFromFile(buffer, mimeType, fileName) {
    if (!buffer || buffer.length === 0) {
      console.error(`[UPLOAD] ❌ File buffer is empty: ${fileName}`);
      throw new Error("Uploaded file is empty");
    }

    const extension = path.extname(fileName).toLowerCase();
    console.log(
      `[UPLOAD] Parsing file ${fileName}, mimeType=${mimeType}, extension=${extension}`
    );

    if (mimeType === "application/pdf" || extension === ".pdf") {
      return this.extractTextFromPDF(buffer);
    }

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === ".docx"
    ) {
      return this.extractTextFromDocx(buffer, fileName);
    }

    if (mimeType === "application/msword" || extension === ".doc") {
      return this.extractTextFromDocx(buffer, fileName);
    }

    console.error(`[UPLOAD] ❌ Unsupported file type: ${mimeType} (${fileName})`);
    throw new Error("Unsupported resume file type. Only PDF and DOCX are allowed.");
  },

  /**
   * Parse PDF file and extract text content
   */
  async extractTextFromPDF(pdfBuffer) {
    try {
      console.log(`[PDF] Parsing PDF (${pdfBuffer.length} bytes)...`);

      const parser = new PDFParse({ data: pdfBuffer });
      const data = await parser.getText();

      if (!data?.text || data.text.trim().length === 0) {
        console.error("[PDF] ❌ No text content found in PDF");
        throw new Error("No text content found in PDF");
      }

      console.log(
        `[PDF] ✅ Extracted ${data.text.length} chars from ${data.numpages || "?"} pages`
      );
      console.log(
        `[PDF] Preview: ${String(data.text)
          .slice(0, 500)
          .replace(/\n/g, " ")}`
      );

      return data.text;
    } catch (error) {
      console.error(`[PDF] ❌ PDF parsing error: ${error.message}`);
      throw new Error(`PDF parsing error: ${error.message}`);
    }
  },

  /**
   * Parse DOCX file and extract text content
   */
  async extractTextFromDocx(docBuffer, fileName) {
    try {
      console.log(`[DOCX] Parsing DOCX (${fileName}, ${docBuffer.length} bytes)...`);
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      const text = result.value || "";

      if (!text.trim()) {
        console.error("[DOCX] ❌ No text content found in DOCX");
        throw new Error("No text content found in DOCX");
      }

      console.log(`[DOCX] ✅ Extracted ${text.length} chars from ${fileName}`);
      console.log(
        `[DOCX] Preview: ${String(text)
          .slice(0, 500)
          .replace(/\n/g, " ")}`
      );
      return text;
    } catch (error) {
      console.error(`[DOCX] ❌ DOCX parsing error: ${error.message}`);
      throw new Error(`DOCX parsing error: ${error.message}`);
    }
  },
};