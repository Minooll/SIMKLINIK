const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Doctor Dashboard - "Lihat semua" and "Lihat selengkapnya" modal integration', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // 1. Verify getActiveDoctor function is declared
  assert.match(
    roleDashboardSrc,
    /function\s+getActiveDoctor\s*\(/,
    'getActiveDoctor helper function must be defined in role-dashboard.js'
  );

  // 2. Verify openFullAgendaDokterModal and openFullMedicalDokterModal exist
  assert.match(
    roleDashboardSrc,
    /async\s+function\s+openFullAgendaDokterModal\s*\(/,
    'openFullAgendaDokterModal must be defined'
  );
  assert.match(
    roleDashboardSrc,
    /async\s+function\s+openFullMedicalDokterModal\s*\(/,
    'openFullMedicalDokterModal must be defined'
  );

  // 3. Verify event listeners are hooked up to buttons
  assert.match(
    roleDashboardSrc,
    /btnViewAllAgenda\.addEventListener\('click'[\s\S]*openFullAgendaDokterModal\(\)/,
    'btnViewAllAgenda must trigger openFullAgendaDokterModal'
  );
  assert.match(
    roleDashboardSrc,
    /btnViewAllLower\.addEventListener\('click'[\s\S]*openFullMedicalDokterModal\(\)/,
    'btnViewAllLower must trigger openFullMedicalDokterModal'
  );

  // 4. Verify doctor.html contains both modal elements and buttons
  const dokterHtml = fs.readFileSync(
    path.join(__dirname, '../dokter.html'),
    'utf-8'
  );
  assert.match(dokterHtml, /id="btnViewAllAgenda"/, 'dokter.html must contain btnViewAllAgenda');
  assert.match(dokterHtml, /id="btnViewAllLower"/, 'dokter.html must contain btnViewAllLower');
  assert.match(dokterHtml, /id="modalFullAgendaDokter"/, 'dokter.html must contain modalFullAgendaDokter');
  assert.match(dokterHtml, /id="modalFullMedicalDokter"/, 'dokter.html must contain modalFullMedicalDokter');
  assert.match(dokterHtml, /id="tableFullAgendaDokterBody"/, 'dokter.html must contain tableFullAgendaDokterBody');
  assert.match(dokterHtml, /id="tableFullMedicalDokterBody"/, 'dokter.html must contain tableFullMedicalDokterBody');
});
