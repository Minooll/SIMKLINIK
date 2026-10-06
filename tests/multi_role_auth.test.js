const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Mock localStorage for Node test runner
const storageMap = new Map();
global.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

const {
  validateReferralCodeFormat,
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  requestPasswordReset,
  validatePasswordInput,
  isFirstTimeGoogleUser,
  linkGoogleAccount,
  loginWithGoogle,
  isGoogleAccountLinked
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

test('multiRoleAuth - validatePasswordInput and isFirstTimeGoogleUser helper logic', () => {
  // Password validation: min 6 chars, equality check
  assert.strictEqual(validatePasswordInput('12345').valid, false);
  assert.match(validatePasswordInput('12345').error, /minimal 6 karakter/i);

  assert.strictEqual(validatePasswordInput('abcdef', 'different').valid, false);
  assert.match(validatePasswordInput('abcdef', 'different').error, /konfirmasi password tidak cocok/i);

  assert.strictEqual(validatePasswordInput('secret123', 'secret123').valid, true);

  // First time Google user check
  const normalUser = { app_metadata: { provider: 'email' } };
  assert.strictEqual(isFirstTimeGoogleUser(normalUser), false);

  const firstTimeGoogle = {
    app_metadata: { provider: 'google' },
    user_metadata: { has_password: false }
  };
  assert.strictEqual(isFirstTimeGoogleUser(firstTimeGoogle), true);

  const returningGoogle = {
    app_metadata: { provider: 'google' },
    user_metadata: { has_password: true }
  };
  assert.strictEqual(isFirstTimeGoogleUser(returningGoogle), false);
});

test('multiRoleAuth - Google OAuth: First-time setup prompts credentials, subsequent logins single-click', async () => {
  global.localStorage.clear();

  const testEmailPasien = 'warga.pasien@gmail.com';

  // 1. First attempt before linking: returns isFirstTime = true
  const firstAttempt = await loginWithGoogle(testEmailPasien, 'pasien');
  assert.strictEqual(firstAttempt.isFirstTime, true);
  assert.strictEqual(firstAttempt.success, false);
  assert.strictEqual(isGoogleAccountLinked(testEmailPasien), false);

  // 2. Link account with username & password
  const linkRes = await linkGoogleAccount({
    email: testEmailPasien,
    username: 'wargapasien',
    fullName: 'Budi Santoso Purworejo',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'pasien'
  });

  assert.strictEqual(linkRes.success, true);
  assert.strictEqual(linkRes.redirect, 'pasien.html');
  assert.strictEqual(isGoogleAccountLinked(testEmailPasien), true);

  // 3. Subsequent login: Single-click Google login without asking username/password again
  const subsequentAttempt = await loginWithGoogle(testEmailPasien, 'pasien');
  assert.strictEqual(subsequentAttempt.isFirstTime, false);
  assert.strictEqual(subsequentAttempt.success, true);
  assert.strictEqual(subsequentAttempt.redirect, 'pasien.html');
  assert.strictEqual(subsequentAttempt.session.role, 'pasien');
  assert.strictEqual(subsequentAttempt.session.username, 'wargapasien');
});

test('multiRoleAuth - Google OAuth for Dokter: validates referral code and redirects to dokter.html', async () => {
  const docEmail = 'dr.anita@gmail.com';

  // Attempt linking without valid referral code
  const failDoctor = await linkGoogleAccount({
    email: docEmail,
    username: 'dranita',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'dokter',
    referralCode: 'INVALID-CODE'
  });
  assert.strictEqual(failDoctor.success, false);
  assert.match(failDoctor.message, /kode unik klinik wajib valid/i);

  // Linking with valid referral code
  const successDoctor = await linkGoogleAccount({
    email: docEmail,
    username: 'dranita',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'dokter',
    referralCode: 'PWR-SEHAT-9X8K2M',
    sipNumber: 'SIP-PWR-099/2025'
  });
  assert.strictEqual(successDoctor.success, true);
  assert.strictEqual(successDoctor.redirect, 'dokter.html');

  // Subsequent login for Dokter is single-click
  const subsequentDoc = await loginWithGoogle(docEmail, 'dokter');
  assert.strictEqual(subsequentDoc.success, true);
  assert.strictEqual(subsequentDoc.isFirstTime, false);
  assert.strictEqual(subsequentDoc.redirect, 'dokter.html');
  assert.strictEqual(subsequentDoc.session.referral_code, 'PWR-SEHAT-9X8K2M');
});

test('multiRoleAuth - Google OAuth for Pemilik Klinik: links and logs in single-click to pemilik.html', async () => {
  const ownerEmail = 'pemilik.klinik@gmail.com';

  const linkOwner = await linkGoogleAccount({
    email: ownerEmail,
    username: 'owner_sehat',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'pemilik',
    fullName: 'H. Sudirman (Pemilik Klinik)'
  });
  assert.strictEqual(linkOwner.success, true);
  assert.strictEqual(linkOwner.redirect, 'pemilik.html');

  // Subsequent login for Pemilik is single-click
  const subsequentOwner = await loginWithGoogle(ownerEmail, 'pemilik');
  assert.strictEqual(subsequentOwner.success, true);
  assert.strictEqual(subsequentOwner.isFirstTime, false);
  assert.strictEqual(subsequentOwner.redirect, 'pemilik.html');
  assert.strictEqual(subsequentOwner.session.role, 'pemilik');
});

test('login.html contains Google OAuth elements, setup modal, 3 role tabs, and forgot password trigger', () => {
  const html = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf8');
  assert.match(html, /id=["']btn-google-login["']/i);
  assert.match(html, /class=["'][^"']*btn-google[^"']*["']/i);
  assert.match(html, /id=["']modal-google-setup["']/i);
  assert.match(html, /id=["']form-google-setup["']/i);
  assert.match(html, /id=["']google-setup-username["']/i);
  assert.match(html, /id=["']google-setup-password["']/i);
  assert.match(html, /id=["']google-setup-confirm["']/i);
  assert.match(html, /id=["']google-setup-code["']/i);

  assert.match(html, /data-role=["']pasien["']/i);
  assert.match(html, /data-role=["']dokter["']/i);
  assert.match(html, /data-role=["']pemilik["']/i);
  assert.doesNotMatch(html, /data-role=["']petugas["']/i);
  assert.match(html, /id=["']referral-code-input["']/i);

  // Forgot password requirements
  assert.match(html, /id=["']link-forgot-password["']/i);
  assert.match(html, /id=["']modal-forgot-password["']/i);
});

