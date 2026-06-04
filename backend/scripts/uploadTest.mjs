import fs from 'fs';
import path from 'path';

const filePath = path.resolve('sample_fresh_resume.pdf');
const fileBuffer = fs.readFileSync(filePath);
const form = new FormData();
const file = new File([fileBuffer], 'sample_fresh_resume.pdf', { type: 'application/pdf' });
form.append('resumes', file);

const res = await fetch('http://localhost:5000/api/candidates/upload-resumes', {
  method: 'POST',
  body: form,
});

console.log('STATUS', res.status);
console.log(await res.text());
