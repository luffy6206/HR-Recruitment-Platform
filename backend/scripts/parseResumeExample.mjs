import fs from 'fs';
import path from 'path';
import { resumeParserService } from '../src/services/resumeParser.service.js';
const fileName = process.argv[2] || 'uploads/resumes/1780514349844-Resume.pdf';
const filePath = path.resolve(process.cwd(), fileName);
const buffer = fs.readFileSync(filePath);
const mimeType = 'application/pdf';
try {
  const text = await resumeParserService.extractTextFromFile(buffer, mimeType, path.basename(fileName));
  console.log('EXTRACTED TEXT PREVIEW');
  console.log(text.slice(0, 1000));
} catch (error) {
  console.error(error);
  process.exit(1);
}
