import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candidate from '../src/modules/candidates/candidate.model.js';

dotenv.config({ path: '.env' });
await mongoose.connect(process.env.MONGODB_URI);
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/inspectDuplicates.mjs <email>');
  process.exit(1);
}
const docs = await Candidate.find({ email }).lean();
console.log('count', docs.length);
for (const d of docs) {
  console.log(JSON.stringify({ id: d._id.toString(), email: d.email, phone: d.phone, isDeleted: d.isDeleted, createdAt: d.createdAt, code: d.code }, null, 2));
}
await mongoose.disconnect();
