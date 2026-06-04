import fs from 'fs';
import path from 'path';

const baseUrl = process.argv[2] || 'http://127.0.0.1:5000';
const resumePath = process.argv[3] || 'uploads/resumes/1780514349844-Resume.pdf';
const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@company.com', password: 'Admin@123' }),
});
const loginData = await loginRes.json();
console.log('loginResponseStatus', loginRes.status);
console.log(JSON.stringify(loginData, null, 2));
const token = loginData?.data?.accessToken;
if (!token) throw new Error('No access token');

const filePath = path.resolve(process.cwd(), resumePath);
const buffer = fs.readFileSync(filePath);

for (let attempt = 1; attempt <= 2; attempt += 1) {
  const formData = new FormData();
  formData.append('resumes', new Blob([buffer]), path.basename(filePath));
  console.log(`\n--- Upload attempt ${attempt} ---`);
  const uploadRes = await fetch(`${baseUrl}/api/candidates/upload-resumes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  console.log('uploadResponseStatus', uploadRes.status);
  const text = await uploadRes.text();
  console.log(text);
}
