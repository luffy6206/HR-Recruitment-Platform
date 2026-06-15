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

    const ensureDroppedIndex = async (name) => {
      const hasIndex = indexes.find((i) => i.name === name);
      if (hasIndex) {
        console.log(`Dropping existing index ${name}`);
        await db.collection(collName).dropIndex(name);
      } else {
        console.log(`Index ${name} not found; continuing`);
      }
    };

    await ensureDroppedIndex('candidateCode_1');
    await ensureDroppedIndex('email_1');
    await ensureDroppedIndex('phone_1');
    await ensureDroppedIndex('emailHash_1');

    console.log('Creating partial unique index on candidateCode for string values');
    await db.collection(collName).createIndex(
      { candidateCode: 1 },
      { unique: true, partialFilterExpression: { candidateCode: { $type: 'string' } } }
    );

    console.log('Creating partial unique index on email for active candidates');
    await db.collection(collName).createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: {
          isDeleted: false,
          email: { $type: 'string' },
        },
      }
    );

    console.log('Creating partial unique index on phone for active candidates');
    await db.collection(collName).createIndex(
      { phone: 1 },
      {
        unique: true,
        partialFilterExpression: {
          isDeleted: false,
          phone: { $type: 'string' },
        },
      }
    );

    console.log('Creating partial unique index on emailHash for active candidates');
    await db.collection(collName).createIndex(
      { emailHash: 1 },
      {
        unique: true,
        partialFilterExpression: {
          isDeleted: false,
          emailHash: { $type: 'string' },
        },
      }
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
