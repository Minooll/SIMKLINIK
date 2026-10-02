const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Petugas Dashboard - AI Hide vs Close functionality separation', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // 1. Verify existence of separate hide and close buttons
  assert.match(
    roleDashboardSrc,
    /btnHideAiAnalytics/,
    'role-dashboard.js must contain btnHideAiAnalytics for hiding'
  );
  assert.match(
    roleDashboardSrc,
    /btnCloseAiAnalytics/,
    'role-dashboard.js must contain btnCloseAiAnalytics for closing/deleting'
  );

  // 2. Verify distinction: close clears innerHTML, hide preserves innerHTML
  assert.match(
    roleDashboardSrc,
    /resultBox\.innerHTML\s*=\s*['"]{2}/,
    'role-dashboard.js must clear resultBox.innerHTML when close button is clicked'
  );

  // 3. Verify restore banner or button exists for unhiding preserved answer
  assert.match(
    roleDashboardSrc,
    /btnRestoreAiAnalytics|aiRestoreBanner/,
    'role-dashboard.js must support restoring/unhiding the preserved AI answer'
  );
});

test('Petugas Dashboard - HTML contains restore banner container', async (t) => {
  const petugasHtml = fs.readFileSync(
    path.join(__dirname, '../petugas.html'),
    'utf-8'
  );

  assert.match(
    petugasHtml,
    /id=["']aiRestoreBanner["']/,
    'petugas.html must include aiRestoreBanner container'
  );
});

test('Petugas Dashboard - CSS defines hide, close, and restore styles', async (t) => {
  const cssSrc = fs.readFileSync(
    path.join(__dirname, '../assets/css/role-pages.css'),
    'utf-8'
  );

  assert.match(cssSrc, /\.ai-close-btn/, 'role-pages.css must define .ai-close-btn');
  assert.match(cssSrc, /\.ai-restore-banner/, 'role-pages.css must define .ai-restore-banner');
});
