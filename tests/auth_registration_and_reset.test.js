const test = require('node:test');
const assert = require('node:assert');

// Import authHelper module
const authHelper = require('../assets/js/auth/authHelper.js');

test('validatePasswordInput rejects passwords shorter than 6 characters', () => {
  const result = authHelper.validatePasswordInput('12345', '12345');
  assert.strictEqual(result.valid, false);
  assert.match(result.error, /minimal 6 karakter/i);
});

test('validatePasswordInput rejects mismatched confirm password', () => {
  const result = authHelper.validatePasswordInput('pass123', 'pass456');
  assert.strictEqual(result.valid, false);
  assert.match(result.error, /konfirmasi password tidak cocok/i);
});

test('validatePasswordInput accepts valid matching password of 6+ characters', () => {
  const result = authHelper.validatePasswordInput('passwordBaru123', 'passwordBaru123');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.error, null);
});

test('isFirstTimeGoogleUser returns true when Google OAuth user has no password registered', () => {
  const user = {
    id: 'user-google-1',
    email: 'pasienbaru@gmail.com',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: { full_name: 'Pasien Baru' }
  };
  const profile = {
    id: 'user-google-1',
    role: 'Pasien'
  };

  const isFirstTime = authHelper.isFirstTimeGoogleUser(user, profile);
  assert.strictEqual(isFirstTime, true);
});

test('isFirstTimeGoogleUser returns false when user has already completed password registration', () => {
  const user = {
    id: 'user-google-2',
    email: 'pasienlama@gmail.com',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: { full_name: 'Pasien Lama', has_password: true }
  };
  const profile = {
    id: 'user-google-2',
    role: 'Pasien'
  };

  const isFirstTime = authHelper.isFirstTimeGoogleUser(user, profile);
  assert.strictEqual(isFirstTime, false);
});

test('isFirstTimeGoogleUser returns false for non-google users', () => {
  const user = {
    id: 'user-email-1',
    email: 'dokter@simklinik.id',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'dr. Ayu' }
  };
  const profile = {
    id: 'user-email-1',
    role: 'Dokter'
  };

  const isFirstTime = authHelper.isFirstTimeGoogleUser(user, profile);
  assert.strictEqual(isFirstTime, false);
});

test('setupNewUserPassword calls supabase auth.updateUser with password and has_password flag', async () => {
  let updatedPayload = null;
  const mockClient = {
    auth: {
      updateUser(payload) {
        updatedPayload = payload;
        return Promise.resolve({ data: { user: { id: 'u1' } }, error: null });
      }
    }
  };

  const result = await authHelper.setupNewUserPassword(mockClient, 'rahasia123');
  assert.strictEqual(result.success, true);
  assert.strictEqual(updatedPayload.password, 'rahasia123');
  assert.strictEqual(updatedPayload.data.has_password, true);
});

test('requestPasswordReset validates email and triggers supabase resetPasswordForEmail', async () => {
  let resetCall = null;
  const mockClient = {
    auth: {
      resetPasswordForEmail(email, options) {
        resetCall = { email, options };
        return Promise.resolve({ data: {}, error: null });
      }
    }
  };

  // 1. Invalid email
  const invalidRes = await authHelper.requestPasswordReset(mockClient, 'invalid-email');
  assert.strictEqual(invalidRes.success, false);
  assert.match(invalidRes.error, /format email tidak valid/i);

  // 2. Valid email
  const validRes = await authHelper.requestPasswordReset(mockClient, 'pasien@example.com', 'http://localhost:8080/login.html');
  assert.strictEqual(validRes.success, true);
  assert.strictEqual(resetCall.email, 'pasien@example.com');
  assert.strictEqual(resetCall.options.redirectTo, 'http://localhost:8080/login.html');
});
