const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('1. Clinic Service loads and provides correct Purworejo clinics and AI context', async () => {
  const clinicCode = fs.readFileSync(path.join(__dirname, '../assets/js/services/clinicService.js'), 'utf-8');
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
  vm.createContext(sandbox);
  vm.runInContext(clinicCode, sandbox);

  const clinicService = sandbox.window.clinicService;
  assert.ok(clinicService, 'clinicService must be exposed on window');

  const clinics = await clinicService.getClinics();
  assert.equal(clinics.length, 3, 'Must have exactly 3 pilot clinics in Purworejo');

  const districts = [...new Set(clinics.map(c => c.district))];
  assert.ok(districts.includes('Purworejo'), 'Must include Purworejo');
  assert.ok(districts.includes('Kutoarjo'), 'Must include Kutoarjo');
  assert.ok(districts.includes('Banyuurip'), 'Must include Banyuurip');

  // Test AI Context generator for chatbot
  assert.equal(typeof sandbox.window.getClinicsContextForAi, 'function', 'getClinicsContextForAi must be exposed on window');
  const aiContext = await sandbox.window.getClinicsContextForAi();
  assert.equal(aiContext.length, 3, 'AI Context must contain all 3 pilot clinics');
  assert.equal(aiContext[0].code, 'KLN-PWR-01');
  assert.equal(aiContext[1].code, 'KLN-PWR-02');
  assert.equal(aiContext[2].code, 'KLN-PWR-03');
  assert.ok(aiContext.every(c => c.district && c.address && Array.isArray(c.services)));
});

test('2. Patient portal integrates clinic discovery, filtering, and booking', () => {
  const pasienHtml = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf-8');
  assert.match(pasienHtml, /id="clinicsExplorerSection"/, 'Must contain clinic explorer section');
  assert.match(pasienHtml, /data-district="Purworejo"/, 'Must contain Purworejo district pill');
  assert.match(pasienHtml, /data-district="Kutoarjo"/, 'Must contain Kutoarjo district pill');
  assert.match(pasienHtml, /data-district="Banyuurip"/, 'Must contain Banyuurip district pill');
  assert.match(pasienHtml, /id="bookingClinicSelect"/, 'Must contain booking clinic dropdown');
});

test('3. Doctor portal integrates clinic affiliation and eliminates Petugas requirement', () => {
  const dokterHtml = fs.readFileSync(path.join(__dirname, '../dokter.html'), 'utf-8');
  assert.match(dokterHtml, /id="doctorClinicSelector"/, 'Must have doctor clinic selector');
  assert.match(dokterHtml, /assets\/js\/services\/clinicService\.js/, 'Doctor portal must load clinicService');
});

test('4. Petugas role eliminated from login and redirects securely', () => {
  const loginHtml = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf-8');
  assert.doesNotMatch(loginHtml, /value="Petugas"/i, 'Login form must not offer Petugas role');

  const petugasHtml = fs.readFileSync(path.join(__dirname, '../petugas.html'), 'utf-8');
  assert.match(petugasHtml, /window\.location\.replace\(['"]dokter\.html['"]\)/, 'petugas.html must redirect to dokter.html');
});

test('5. Database schema has clinics table and clinic_id foreign keys', () => {
  const schemaSql = fs.readFileSync(path.join(__dirname, '../config/supabase-complete-schema.sql'), 'utf-8');
  assert.match(schemaSql, /create table if not exists public\.clinics/i, 'Schema must define public.clinics table');
  assert.match(schemaSql, /clinic_id uuid references public\.clinics/i, 'Schema must link clinic_id to clinics table');
  assert.match(schemaSql, /check \(role in \('Pasien', 'Dokter', 'Admin'\)\)/i, 'Schema must constrain role to Pasien, Dokter, Admin');

  const seedSql = fs.readFileSync(path.join(__dirname, '../config/supabase-seed-clinics-purworejo.sql'), 'utf-8');
  assert.match(seedSql, /KLN-PWR-01/, 'Seed must define KLN-PWR-01');
  assert.match(seedSql, /KLN-PWR-02/, 'Seed must define KLN-PWR-02');
  assert.match(seedSql, /KLN-PWR-03/, 'Seed must define KLN-PWR-03');
});
