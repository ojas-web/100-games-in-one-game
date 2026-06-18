const { randomBytes, pbkdf2Sync, timingSafeEqual } = require('crypto');
const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';
function validatePassword(password = '') {
  const value = String(password);
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (value.length > 128) return 'Password must be 128 characters or fewer';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must include at least one letter and one number';
  return '';
}
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}
function verifyPassword(password, stored = '') {
  const [scheme, iterations, salt, hash] = String(stored).split('$');
  if (scheme !== 'pbkdf2' || !iterations || !salt || !hash) return false;
  const actual = pbkdf2Sync(String(password), salt, Number(iterations), KEY_LENGTH, DIGEST);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
module.exports = { hashPassword, verifyPassword, validatePassword };
