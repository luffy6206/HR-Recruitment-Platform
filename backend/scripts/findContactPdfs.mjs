import fs from 'fs';
import path from 'path';
const resumeDir = path.resolve(process.cwd(), 'uploads', 'resumes');
const files = fs.readdirSync(resumeDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
for (const file of files) {
  const fullPath = path.join(resumeDir, file);
  const bytes = fs.readFileSync(fullPath);
  const text = Array.from(bytes).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ' ')).join('');
  if (text.match(/@|Phone|phone|Email|email/)) {
    console.log(file);
  }
}
