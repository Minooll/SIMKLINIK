const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  getClinics,
  getClinicsByDistrict,
  generateReferralCode,
  createDoctor,
  getDoctorsByClinic
} = require('../assets/js/services/clinicService.js');

test('clinicService provides clinic list, district filtering, and doctor management', async () => {
  const allClinics = await getClinics();
  assert.ok(Array.isArray(allClinics));
  assert.ok(allClinics.length >= 3, 'Must have at least 3 Purworejo pilot clinics');

  const kutoarjoClinics = await getClinicsByDistrict('Kutoarjo');
  assert.ok(kutoarjoClinics.every(c => c.district.toLowerCase() === 'kutoarjo'));

  const newCode = generateReferralCode('SEHAT');
  assert.match(newCode, /^PWR-SEHAT-[A-Z0-9]{6}$/);

  const doc = await createDoctor({
    clinic_id: allClinics[0].id,
    full_name: 'dr. Test Sp.A',
    specialty: 'Anak',
    sip_number: 'SIP-TEST-001',
    daily_quota: 25
  });
  assert.strictEqual(doc.full_name, 'dr. Test Sp.A');

  const doctors = await getDoctorsByClinic(allClinics[0].id);
  assert.ok(doctors.some(d => d.sip_number === 'SIP-TEST-001'));
});

test('pemilik.html provides clinic profile and doctor management interface', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pemilik.html'), 'utf8');
  assert.match(html, /id=["']clinic-referral-code["']/i);
  assert.match(html, /id=["']btn-copy-code["']/i);
  assert.match(html, /id=["']doctor-form["']/i);
  assert.match(html, /id=["']doctor-quota-input["']/i);
});
