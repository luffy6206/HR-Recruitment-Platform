import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const filePath = path.resolve(process.argv[2] || 'sample_fresh_resume.pdf');
const data = fs.readFileSync(filePath);
const text = await pdfParse(data);
console.log(text.text.slice(0, 2000));
