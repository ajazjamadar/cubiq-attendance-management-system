const { findUserByUsername } = require('./src/lib/db');
const { verifyPassword } = require('./src/lib/auth');
const { getStorageMode } = require('./src/lib/db');

async function check() {
  console.log('Current Storage Mode:', getStorageMode());
  const attempts = ['admin', 'Admin', 'md afnan', 'Md Afnan', 'mdafnan', 'Afnan@Cubiq.com', 'afnan@cubiq.com'];
  for (const a of attempts) {
    const u = await findUserByUsername(a);
    if (!u) {
      console.log(`Attempt: "${a}" -> NOT FOUND`);
    } else {
      const matchExact = await verifyPassword('Afnan@Cubiq.com', u.password_hash);
      const matchLower = await verifyPassword('afnan@cubiq.com', u.password_hash);
      console.log(`Attempt: "${a}" -> Found: ${u.name} (username: ${u.username}), Role: ${u.role}, Password "Afnan@Cubiq.com" matches: ${matchExact}, "afnan@cubiq.com" matches: ${matchLower}`);
    }
  }
}
check();
