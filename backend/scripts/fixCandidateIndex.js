import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGO) {
  console.error('MONGO_URI / MONGODB_URI not set in .env');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGO);
    const db = mongoose.connection.db;
    const collName = 'candidates';

    console.log('Connected. Listing indexes for', collName);
    const indexes = await db.collection(collName).indexes();
    console.log(indexes);

    // Attempt to drop existing candidateCode_1 index if present
    const hasIndex = indexes.find(i => i.name === 'candidateCode_1');
    if (hasIndex) {
      console.log('Dropping existing index candidateCode_1');
      await db.collection(collName).dropIndex('candidateCode_1');
    } else {
      console.log('Index candidateCode_1 not found; continuing');
    }

    // Create a partial unique index that only indexes string candidateCode values
    // This avoids indexing null values and non-string legacy values
    console.log('Creating partial unique index on candidateCode for string values');
    await db.collection(collName).createIndex(
      { candidateCode: 1 },
      { unique: true, partialFilterExpression: { candidateCode: { $type: 'string' } } }
    );

    console.log('Index migration complete. Current indexes:');
    console.log(await db.collection(collName).indexes());
    process.exit(0);
  } catch (err) {
    console.error('Error during index migration:', err);
    process.exit(2);
  }
}

run();
