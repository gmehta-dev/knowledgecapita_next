/**
 * Set a new password for an existing user (e.g. the super admin).
 * Changes exactly one field (`password`, bcrypt-hashed like sign-up does) on one user document.
 *
 *   MONGODB_URI=... node scripts/set-password.mjs someone@example.com
 *
 * The password is typed at a hidden prompt (never passed as an argument, so it
 * stays out of shell history and the process list). Asks for confirmation.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline/promises';

const email = process.argv.slice(2).find((a) => !a.startsWith('--'))?.toLowerCase();
const uri = process.env.MONGODB_URI;

if (!email || !uri) {
  console.error('Usage: MONGODB_URI=<uri> node scripts/set-password.mjs <email>');
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error('Run this in an interactive terminal (the password is read from a hidden prompt).');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = '';
    // Turn off echo before showing the prompt, so nothing typed early is displayed.
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    process.stdout.write(question);
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.off('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') { // Ctrl+C
          process.stdout.write('\nAborted, nothing changed.\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const conn = await mongoose.createConnection(uri).asPromise();
const users = conn.db.collection('users');

const user = await users.findOne({ email }, { projection: { name: 1, email: 1, role: 1 } });
if (!user) {
  console.error(`No user with email ${email}`);
  await conn.close();
  process.exit(1);
}

console.log(`Database: ${conn.host}/${conn.name}`);
console.log(`User:     ${user.name} <${user.email}> (${user._id}), role: ${user.role || 'user'}`);

const password = await askHidden('New password (min 8 characters): ');
if (password.length < 8) {
  console.error('Password must be at least 8 characters. Nothing changed.');
  await conn.close();
  process.exit(1);
}
if (password !== await askHidden('Repeat new password: ')) {
  console.error('Passwords do not match. Nothing changed.');
  await conn.close();
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question('Set this password? (yes/no) ');
rl.close();
if (answer.trim().toLowerCase() !== 'yes') {
  console.log('Aborted, nothing changed.');
  await conn.close();
  process.exit(0);
}

await users.updateOne({ _id: user._id }, { $set: { password: await bcrypt.hash(password, 12) } });
console.log('Done. Log in with the new password.');
await conn.close();
