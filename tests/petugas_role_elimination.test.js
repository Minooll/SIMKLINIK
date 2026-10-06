const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Role Elimination - Petugas role removed from login and redirected', () => {
  const loginHtml = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf-8');
  assert.doesNotMatch(loginHtml, /value="Petugas"/i, 'login.html must not contain Petugas role option');

  const petugasHtml = fs.readFileSync(path.join(__dirname, '../petugas.html'), 'utf-8');
  assert.match(petugasHtml, /window\.location\.replace\(['"]dokter\.html['"]\)/, 'petugas.html must safely redirect to dokter.html');

  const loginJs = fs.readFileSync(path.join(__dirname, '../assets/js/auth/login.js'), 'utf-8');
  assert.doesNotMatch(loginJs, /'petugas\.html'/i, 'login.js must not redirect to petugas.html');
});
