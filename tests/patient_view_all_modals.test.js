const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

test('Patient Dashboard - "Lihat semua" and "Lihat selengkapnya" modal integration and JS syntax', async (t) => {
  const roleDashboardPath = path.join(__dirname, '../assets/js/dashboard/role-dashboard.js');

  // 1. Verify JS file has no syntax errors
  assert.doesNotThrow(() => {
    execSync(`node --check "${roleDashboardPath}"`);
  }, 'role-dashboard.js must not have any syntax or redeclaration errors');

  const roleDashboardSrc = fs.readFileSync(roleDashboardPath, 'utf-8');

  // 2. Verify openFullAgendaPasienModal and openFullMedicalPasienModal exist
  assert.match(
    roleDashboardSrc,
    /async\s+function\s+openFullAgendaPasienModal\s*\(/,
    'openFullAgendaPasienModal must be defined'
  );
  assert.match(
    roleDashboardSrc,
    /async\s+function\s+openFullMedicalPasienModal\s*\(/,
    'openFullMedicalPasienModal must be defined'
  );

  // 3. Verify event listeners are hooked up to buttons
  assert.match(
    roleDashboardSrc,
    /btnViewAllAgenda\.addEventListener\('click'[\s\S]*openFullAgendaPasienModal\(\)/,
    'btnViewAllAgenda must trigger openFullAgendaPasienModal'
  );
  assert.match(
    roleDashboardSrc,
    /btnViewAllLower\.addEventListener\('click'[\s\S]*openFullMedicalPasienModal\(\)/,
    'btnViewAllLower must trigger openFullMedicalPasienModal'
  );

  // 4. Verify pasien.html contains both modal elements and buttons
  const pasienHtml = fs.readFileSync(
    path.join(__dirname, '../pasien.html'),
    'utf-8'
  );
  assert.match(pasienHtml, /id="btnViewAllAgenda"/, 'pasien.html must contain btnViewAllAgenda');
  assert.match(pasienHtml, /id="btnViewAllLower"/, 'pasien.html must contain btnViewAllLower');
  assert.match(pasienHtml, /id="modalFullAgendaPasien"/, 'pasien.html must contain modalFullAgendaPasien');
  assert.match(pasienHtml, /id="modalFullMedicalPasien"/, 'pasien.html must contain modalFullMedicalPasien');
  assert.match(pasienHtml, /id="tableFullAgendaPasienBody"/, 'pasien.html must contain tableFullAgendaPasienBody');
  assert.match(pasienHtml, /id="tableFullMedicalPasienBody"/, 'pasien.html must contain tableFullMedicalPasienBody');
});
