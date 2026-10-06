const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Landing Page (index.html) - Regional Purworejo Multi-Clinic Architecture', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

  // 1. Regional branding & 3 Pilot Clinics Section
  assert.match(indexHtml, /id="klinik"/, 'index.html must contain #klinik section');
  assert.match(indexHtml, /KLN-PWR-01/, 'Must feature Klinik Pratama Sehat Mandiri Purworejo (KLN-PWR-01)');
  assert.match(indexHtml, /KLN-PWR-02/, 'Must feature Klinik Pratama & Bersalin Kutoarjo Medika (KLN-PWR-02)');
  assert.match(indexHtml, /KLN-PWR-03/, 'Must feature Klinik Pratama Keluarga Banyuurip (KLN-PWR-03)');

  // 2. District badges
  assert.match(indexHtml, /Purworejo \(Pusat Kota\)/, 'Must display Purworejo Kota district badge');
  assert.match(indexHtml, /Kutoarjo/, 'Must display Kutoarjo district badge');
  assert.match(indexHtml, /Banyuurip/, 'Must display Banyuurip district badge');

  // 3. Workflow without counter friction
  assert.match(indexHtml, /id="alur"/, 'Must contain workflow section #alur');

  // 4. 2-Role Portals
  assert.match(indexHtml, /Portal Pasien Mandiri/, 'Must feature Portal Pasien Mandiri');
  assert.match(indexHtml, /Portal Dokter Faskes/, 'Must feature Portal Dokter Faskes');
  assert.doesNotMatch(indexHtml, /Portal Petugas/i, 'Must not feature Portal Petugas');
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
