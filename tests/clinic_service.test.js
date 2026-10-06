const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('clinicService - Provides 3 Purworejo clinics, district filtering, and AI context', async () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, '../assets/js/services/clinicService.js'), 'utf-8');
  assert.match(serviceCode, /getClinics\s*\(/, 'Must have getClinics method');
  assert.match(serviceCode, /getClinicsByDistrict\s*\(/, 'Must have getClinicsByDistrict method');
  assert.match(serviceCode, /getClinicsContextForAi\s*=/, 'Must expose getClinicsContextForAi helper');
  assert.match(serviceCode, /KLN-PWR-01/, 'Must include fallback mock clinic 1');
  assert.match(serviceCode, /KLN-PWR-02/, 'Must include fallback mock clinic 2');
  assert.match(serviceCode, /KLN-PWR-03/, 'Must include fallback mock clinic 3');

  // Test functional execution of clinicService in sandbox
  const vm = require('vm');
  const sandbox = {
    window: {},
    console: console,
  };
  vm.createContext(sandbox);
  vm.runInContext(serviceCode, sandbox);

  assert.ok(sandbox.window.clinicService, 'clinicService must be attached to window');
  assert.equal(typeof sandbox.window.getClinicsContextForAi, 'function', 'getClinicsContextForAi must be exposed');

  const clinics = await sandbox.window.clinicService.getClinics();
  assert.equal(clinics.length, 3, 'Must return 3 pilot clinics');

  const kutoarjoClinics = await sandbox.window.clinicService.getClinicsByDistrict('Kutoarjo');
  assert.equal(kutoarjoClinics.length, 1, 'Kutoarjo must have 1 clinic');
  assert.equal(kutoarjoClinics[0].code, 'KLN-PWR-02');

  const aiContext = await sandbox.window.getClinicsContextForAi();
  assert.equal(aiContext.length, 3);
  assert.ok(aiContext[0].name && aiContext[0].district && aiContext[0].services);
});
