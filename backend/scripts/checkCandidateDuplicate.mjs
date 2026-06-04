import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import Candidate from '../src/modules/candidates/candidate.model.js';

const email = process.argv[2];
const phone = process.argv[3];

if (!email && !phone) {
  console.error('Usage: node checkCandidateDuplicate.mjs <email> [phone]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

console.log('Connected to Mongo');
const query = { isDeleted: false, $or: [] };
if (email) query.$or.push({ email });
if (phone) query.$or.push({ phone });
if (query.$or.length === 0) {
  console.error('No conditions');
  process.exit(1);
}
const existing = await Candidate.findOne(query);
console.log('Query', JSON.stringify(query));
console.log('Existing candidate:', existing ? { id: existing._id.toString(), email: existing.email, phone: existing.phone } : null);
process.exit(0);
