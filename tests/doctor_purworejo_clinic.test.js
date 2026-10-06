const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Doctor Portal - Clinic affiliation header and direct queue calling', () => {
  const dokterHtml = fs.readFileSync(path.join(__dirname, '../dokter.html'), 'utf-8');
  const roleJs = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'), 'utf-8');

  assert.match(dokterHtml, /id="doctorClinicSelector"/, 'dokter.html must contain doctorClinicSelector switcher');
  assert.match(dokterHtml, /assets\/js\/services\/clinicService\.js/, 'dokter.html must include clinicService.js');
  assert.match(roleJs, /doctorActiveClinicId/, 'role-dashboard.js must track active clinic in doctor portal');
  assert.match(roleJs, /renderDokterDashboard/, 'role-dashboard.js must define renderDokterDashboard');
});
