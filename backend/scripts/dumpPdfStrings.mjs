import fs from 'fs';
const data = fs.readFileSync(process.argv[2] || 'sample_fresh_resume.pdf');
const text = Array.from(data)
  .map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : ' ')
  .join('');
const lines = text.split(/\s+/).filter(Boolean);
console.log(lines.slice(0, 200).join(' '));
console.log('----- matching chunks -----');
for (const chunk of lines) {
  if (chunk.includes('@') || /Phone|phone|Email|email/.test(chunk)) {
    console.log(chunk);
  }
}
