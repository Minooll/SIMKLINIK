const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Role Elimination - Petugas role, dashboard, and database policies completely deleted', () => {
  // 1. petugas.html file must be deleted completely
  const petugasPath = path.join(__dirname, '../petugas.html');
  assert.strictEqual(fs.existsSync(petugasPath), false, 'petugas.html must be completely deleted from repository');

  // 2. login.html must only support Pasien and Dokter
  const loginHtml = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf-8');
  assert.doesNotMatch(loginHtml, /value="Petugas"/i, 'login.html must not contain Petugas role option');
  assert.doesNotMatch(loginHtml, /data-role="petugas"/i, 'login.html must not contain Petugas tab');

  // 3. login.js must not redirect to petugas.html
  const loginJs = fs.readFileSync(path.join(__dirname, '../assets/js/auth/login.js'), 'utf-8');
  assert.doesNotMatch(loginJs, /petugas\.html/i, 'login.js must not reference petugas.html');

  // 4. Database schema policies must not reference Petugas or Kasir/Resepsionis
  const schemaSql = fs.readFileSync(path.join(__dirname, '../config/supabase-complete-schema.sql'), 'utf-8');
  assert.doesNotMatch(schemaSql, /'Petugas'/i, 'Database schema RLS policies must not contain Petugas role');
  assert.doesNotMatch(schemaSql, /'Kasir\/Resepsionis'/i, 'Database schema RLS policies must not contain Kasir/Resepsionis role');

  // 5. Landing page only links to Pasien and Dokter
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
  assert.doesNotMatch(indexHtml, /petugas\.html/i, 'index.html must not link to petugas.html');
  assert.doesNotMatch(indexHtml, /Portal Petugas/i, 'index.html must not mention Portal Petugas');
});
