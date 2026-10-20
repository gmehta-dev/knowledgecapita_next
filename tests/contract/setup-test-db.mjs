/**
 * Creates/refreshes an isolated test database for the API contract suite by
 * cloning a LOCAL source database. Refuses to touch anything that is not on
 * localhost or whose target name does not end in "_test".
 *
 * Usage:
 *   SOURCE_URI=mongodb://localhost:27017/sharecom \
 *   TEST_URI=mongodb://localhost:27017/sharecom_contract_test \
 *   node tests/contract/setup-test-db.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ADMIN } from './fixtures.mjs';

const SOURCE_URI = process.env.SOURCE_URI || 'mongodb://localhost:27017/sharecom';
const TEST_URI = process.env.TEST_URI || 'mongodb://localhost:27017/sharecom_contract_test';

function assertSafe(uri, mustBeTest) {
  const u = new URL(uri);
  if (!['localhost', '127.0.0.1'].includes(u.hostname)) {
    throw new Error(`Refusing to use non-local MongoDB host: ${u.hostname}`);
  }
  const db = u.pathname.replace(/^\//, '');
  if (mustBeTest && !db.endsWith('_test')) {
    throw new Error(`Refusing to write to a database not ending in "_test": ${db}`);
  }
  return db;
}

assertSafe(SOURCE_URI, false);
const testDbName = assertSafe(TEST_URI, true);

const source = await mongoose.createConnection(SOURCE_URI).asPromise();
const target = await mongoose.createConnection(TEST_URI).asPromise();

await target.db.dropDatabase();

const collections = await source.db.listCollections().toArray();
for (const { name } of collections) {
  if (name.startsWith('system.')) continue;
  const docs = await source.db.collection(name).find().toArray();
  if (docs.length) await target.db.collection(name).insertMany(docs);
  const indexes = await source.db.collection(name).indexes();
  for (const idx of indexes) {
    if (idx.name === '_id_') continue;
    const { key, name: idxName, v, ns, ...opts } = idx;
    await target.db.collection(name).createIndex(key, { name: idxName, ...opts });
  }
  console.log(`cloned ${name}: ${docs.length} docs`);
}

// Known admin account (email on the AUTHORIZED_EMAILS allow-list) - test DB only.
const users = target.db.collection('users');
await users.deleteMany({ $or: [{ email: ADMIN.email }, { phone_number: ADMIN.phone_number }] });
await users.insertOne({
  name: 'Contract Admin',
  email: ADMIN.email,
  phone_number: ADMIN.phone_number,
  password: await bcrypt.hash(ADMIN.password, 12),
  name_visibility: 1, profile_visibility: 1, brief_bio_visibility: 1, experience_visibility: 1,
  calender_visibility: 1, scheduling_visibility: 1, detailed_bio_visibility: 1,
  created_at: new Date(), updated_at: new Date()
});

console.log(`Test database "${testDbName}" ready.`);
await source.close();
await target.close();
