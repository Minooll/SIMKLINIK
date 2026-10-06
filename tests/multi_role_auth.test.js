const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  validateReferralCodeFormat,
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  requestPasswordReset
} = require('../assets/js/auth/multiRoleAuth.js');

test('multiRoleAuth - Referral code validation and brute force rate limiting', () => {
  // Test code format: PWR-[PREFIX]-[6 ALPHANUMERIC]
  assert.strictEqual(validateReferralCodeFormat('PWR-SEHAT-9X8K2M'), true);
  assert.strictEqual(validateReferralCodeFormat('PWR-MEDIKA-ABC123'), true);
  assert.strictEqual(validateReferralCodeFormat('INVALID-CODE'), false);
  assert.strictEqual(validateReferralCodeFormat('PWR-123'), false);

  // Rate limiting test
  const testId = 'test-doctor-rate-limit';
  resetAttempts(testId);
  assert.strictEqual(checkRateLimit(testId).isLocked, false);

  recordFailedAttempt(testId);
  recordFailedAttempt(testId);
  assert.strictEqual(checkRateLimit(testId).isLocked, false);

  recordFailedAttempt(testId); // 3rd failure locks it
  const lockedStatus = checkRateLimit(testId);
  assert.strictEqual(lockedStatus.isLocked, true);
  assert.ok(lockedStatus.remainingMinutes > 0);
});

test('multiRoleAuth - requestPasswordReset validates email and dispatches reset instructions', async () => {
  const invalidRes = await requestPasswordReset('invalid-email');
  assert.strictEqual(invalidRes.success, false);

  const emptyRes = await requestPasswordReset('');
  assert.strictEqual(emptyRes.success, false);

  const validRes = await requestPasswordReset('pasien@purworejo.id');
  assert.strictEqual(validRes.success, true);
  assert.match(validRes.message, /pasien@purworejo\.id/i);
});

test('login.html contains 3 role tabs, forgot password trigger, modal, and no legacy petugas references', () => {
  const html = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf8');
  assert.match(html, /data-role=["']pasien["']/i);
  assert.match(html, /data-role=["']dokter["']/i);
  assert.match(html, /data-role=["']pemilik["']/i);
  assert.doesNotMatch(html, /data-role=["']petugas["']/i);
  assert.match(html, /id=["']referral-code-input["']/i);
  // Forgot password requirements
  assert.match(html, /id=["']link-forgot-password["']/i);
  assert.match(html, /id=["']modal-forgot-password["']/i);
});
