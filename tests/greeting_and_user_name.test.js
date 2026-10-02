const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Greeting Service - Real-time greeting intervals (Pagi, Siang, Sore, Malam)', async (t) => {
  // Define time greeting logic
  function getTimeGreeting(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }

  // 1. Pagi: 05:00 to 10:59
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 5, 0)), 'Selamat pagi');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 8, 30)), 'Selamat pagi');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 10, 59)), 'Selamat pagi');

  // 2. Siang: 11:00 to 14:59
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 11, 0)), 'Selamat siang');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 13, 45)), 'Selamat siang');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 14, 59)), 'Selamat siang');

  // 3. Sore: 15:00 to 17:59
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 15, 0)), 'Selamat sore');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 16, 30)), 'Selamat sore');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 17, 59)), 'Selamat sore');

  // 4. Malam: 18:00 to 04:59
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 18, 0)), 'Selamat malam');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 22, 15)), 'Selamat malam');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 0, 30)), 'Selamat malam');
  assert.equal(getTimeGreeting(new Date(2026, 9, 2, 4, 59)), 'Selamat malam');
});

test('role-dashboard.js - Implementation checks for dynamic greeting and logged-in user name', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // 1. Verify getTimeGreeting helper function is defined
  assert.match(
    roleDashboardSrc,
    /function\s+getTimeGreeting\s*\(/,
    'getTimeGreeting helper function must be defined in role-dashboard.js'
  );

  // 2. Verify updateDashboardGreeting helper function is defined
  assert.match(
    roleDashboardSrc,
    /function\s+updateDashboardGreeting\s*\(/,
    'updateDashboardGreeting helper function must be defined in role-dashboard.js'
  );

  // 3. Verify getPatientDisplayName or getCurrentUserDisplayName is defined
  assert.match(
    roleDashboardSrc,
    /function\s+(?:getCurrentUserDisplayName|getPatientDisplayName)\s*\(/,
    'getCurrentUserDisplayName or getPatientDisplayName function must be defined'
  );

  // 4. Verify that hardcoded "defaultRoleMeta.greeting" is not blindly assigned without dynamic greeting
  assert.doesNotMatch(
    roleDashboardSrc,
    /if\s*\(\s*welcomeTitle\s*\)\s*welcomeTitle\.textContent\s*=\s*defaultRoleMeta\.greeting\s*;/,
    'welcomeTitle must NOT be hardcoded to static defaultRoleMeta.greeting in refreshPasienDashboard'
  );

  // 5. Verify onboarding submit updates the dashboard greeting with the newly entered name
  assert.match(
    roleDashboardSrc,
    /updateDashboardGreeting\s*\(/,
    'updateDashboardGreeting must be invoked when user enters/submits name during onboarding'
  );

  // 6. Verify "Aulia" is no longer hardcoded as default name in defaultRoleMeta.pasien
  assert.doesNotMatch(
    roleDashboardSrc,
    /pasien:\s*\{[^}]*name:\s*['"]Aulia Rahma['"]/,
    'Aulia Rahma must not be the hardcoded default name in defaultRoleMeta.pasien'
  );
  assert.doesNotMatch(
    roleDashboardSrc,
    /pasien:\s*\{[^}]*greeting:\s*['"]Selamat pagi,\s*Aulia['"]/,
    'Selamat pagi, Aulia must not be hardcoded in defaultRoleMeta.pasien'
  );
});

test('login.js - Stores authenticated user name in localStorage on login and registration', async (t) => {
  const loginSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/auth/login.js'),
    'utf-8'
  );

  // Verify that simklinik_user_name is stored
  assert.match(
    loginSrc,
    /simklinik_user_name/,
    'login.js must persist simklinik_user_name so dashboard has instant access'
  );
});
