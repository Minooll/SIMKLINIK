const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Patient Portal - Purworejo clinic directory and booking integration', () => {
  const pasienHtml = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf-8');
  const roleJs = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'), 'utf-8');
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/role-pages.css'), 'utf-8');

  // 1. Verify HTML elements in pasien.html
  assert.match(pasienHtml, /id="clinicsExplorerSection"/, 'pasien.html must contain clinicsExplorerSection');
  assert.match(pasienHtml, /id="bookingClinicSelect"/, 'booking modal must have bookingClinicSelect dropdown');
  assert.match(pasienHtml, /assets\/js\/services\/clinicService\.js/, 'pasien.html must load clinicService.js');
  assert.match(pasienHtml, /id="pillAllPurworejo"/, 'pasien.html must contain pillAllPurworejo');
  assert.match(pasienHtml, /id="pillKecPurworejo"/, 'pasien.html must contain pillKecPurworejo');
  assert.match(pasienHtml, /id="pillKecKutoarjo"/, 'pasien.html must contain pillKecKutoarjo');
  assert.match(pasienHtml, /id="pillKecBanyuurip"/, 'pasien.html must contain pillKecBanyuurip');

  // 2. Verify JS functions in role-dashboard.js
  assert.match(roleJs, /function\s+renderClinicsExplorer/, 'role-dashboard.js must define renderClinicsExplorer');
  assert.match(roleJs, /window\.openBookingWithClinic/, 'role-dashboard.js must expose openBookingWithClinic');
  assert.match(roleJs, /bookingClinicSelect/, 'role-dashboard.js must bind bookingClinicSelect');

  // 3. Verify CSS styling in role-pages.css
  assert.match(css, /\.clinics-explorer-section/i, 'CSS must style clinics-explorer-section');
  assert.match(css, /\.clinic-card/i, 'CSS must style clinic-card');
});
