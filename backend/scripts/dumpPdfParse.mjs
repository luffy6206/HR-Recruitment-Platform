import { createRequire } from 'module';
const requireFn = createRequire(import.meta.url);
const pdf = requireFn('pdf-parse');
console.log('pdf type:', typeof pdf);
console.log('keys:', Object.keys(pdf));
console.log('pdf:', pdf);
