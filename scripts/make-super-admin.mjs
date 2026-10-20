/**
 * Grant (or revoke) the super admin role for an existing user.
 * Changes exactly one field (`role`) on one user document.
 *
 *   MONGODB_URI=... node scripts/make-super-admin.mjs someone@example.com
 *   MONGODB_URI=... node scripts/make-super-admin.mjs someone@example.com --revoke
 *
 * Asks for confirmation unless --yes is passed.
 */
import mongoose from 'mongoose';
import readline from 'readline/promises';

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'))?.toLowerCase();
const revoke = args.includes('--revoke');
const yes = args.includes('--yes');
const uri = process.env.MONGODB_URI;

if (!email || !uri) {
  console.error('Usage: MONGODB_URI=<uri> node scripts/make-super-admin.mjs <email> [--revoke] [--yes]');
  process.exit(1);
}

const conn = await mongoose.createConnection(uri).asPromise();
const users = conn.db.collection('users');

const user = await users.findOne({ email }, { projection: { name: 1, email: 1, role: 1 } });
if (!user) {
  console.error(`No user with email ${email}`);
  await conn.close();
  process.exit(1);
}

const newRole = revoke ? 'user' : 'super_admin';
console.log(`Database: ${conn.host}/${conn.name}`);
console.log(`User:     ${user.name} <${user.email}> (${user._id})`);
console.log(`Role:     ${user.role || 'user'} -> ${newRole}`);

if (!yes) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Apply this change? (yes/no) ');
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Aborted, nothing changed.');
    await conn.close();
    process.exit(0);
  }
}

await users.updateOne({ _id: user._id }, { $set: { role: newRole } });
console.log('Done. The user must log out and back in to see the Admin menu.');
await conn.close();
