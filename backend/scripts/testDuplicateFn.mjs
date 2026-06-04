import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { findDuplicateCandidate } from '../src/modules/candidates/candidate.service.js';

dotenv.config({ path: '.env' });
await mongoose.connect(process.env.MONGODB_URI);
const candidate = await findDuplicateCandidate({ email: 'ashishraj6206@gmail.com', phone: '8709734685' });
console.log('found', candidate ? { id: candidate._id.toString(), email: candidate.email, phone: candidate.phone, isDeleted: candidate.isDeleted } : null);
await mongoose.disconnect();
