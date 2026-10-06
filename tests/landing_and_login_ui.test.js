const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Direct Entry (index.html) - Instant Redirect to login.html', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

  // 1. Instant redirection to login.html
  assert.match(indexHtml, /url=login\.html/i, 'index.html must have meta refresh to login.html');
  assert.match(indexHtml, /window\.location\.replace\(["']login\.html["']\)/, 'index.html must have JS replace to login.html');
  assert.match(indexHtml, /href=["']login\.html["']/, 'index.html must have manual link fallback to login.html');

  // 2. Zero references to Petugas
  assert.doesNotMatch(indexHtml, /petugas/i, 'index.html must not mention Petugas');
});

test('Login Page (login.html) - 2-Role and 1-Click Demo Autofill Integration', () => {
  const loginHtml = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf-8');

  // 1. 2-Role switcher tabs
  assert.match(loginHtml, /data-role="pasien"/, 'Must have Pasien role option');
  assert.match(loginHtml, /data-role="dokter"/, 'Must have Dokter role option');
  assert.doesNotMatch(loginHtml, /data-role="petugas"/i, 'Must not offer Petugas role option');

  // 2. 1-Click Demo credentials
  assert.match(loginHtml, /id="btnFillDemoPasien"/, 'Must have 1-click button for Pasien demo');
  assert.match(loginHtml, /id="btnFillDemoDokter"/, 'Must have 1-click button for Dokter demo');

  // 3. Role Hint Banner
  assert.match(loginHtml, /id="roleHintBanner"/, 'Must have dynamic role hint banner');
  assert.match(loginHtml, /id="roleHintText"/, 'Must have role hint text');

  // 4. JavaScript handlers wired in login.js
  const loginJs = fs.readFileSync(path.join(__dirname, '../assets/js/auth/login.js'), 'utf-8');
  assert.match(loginJs, /btnFillDemoPasien/, 'login.js must handle btnFillDemoPasien click');
  assert.match(loginJs, /btnFillDemoDokter/, 'login.js must handle btnFillDemoDokter click');
  assert.match(loginJs, /roleHintText/, 'login.js must update roleHintText dynamically');
});
