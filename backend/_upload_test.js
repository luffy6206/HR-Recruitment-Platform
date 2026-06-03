import fs from "fs";
import path from "path";

const baseUrl = "http://127.0.0.1:5000";
const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@company.com", password: "Admin@123" }),
});
const loginData = await loginRes.json();
console.log("loginResponseStatus", loginRes.status);
console.log(JSON.stringify(loginData, null, 2));
const token = loginData?.data?.accessToken;
if (!token) throw new Error("No access token");
const formData = new FormData();
const filePath = path.join(process.cwd(), "sample_resume.pdf");
const buffer = fs.readFileSync(filePath);
formData.append("resumes", new Blob([buffer]), "sample_resume.pdf");
const uploadRes = await fetch(`${baseUrl}/api/candidates/upload-resumes`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
console.log("uploadResponseStatus", uploadRes.status);
console.log(await uploadRes.text());
