const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  getClinics,
  getClinicsByDistrict,
  generateReferralCode,
  createDoctor,
  getDoctorsByClinic,
  updateDoctor,
  deleteDoctor,
  toggleDoctorCuti
} = require('../assets/js/services/clinicService.js');

test('clinicService provides clinic list, district filtering, and doctor management (CRUD & cuti)', async () => {
  const allClinics = await getClinics();
  assert.ok(Array.isArray(allClinics));
  assert.ok(allClinics.length >= 3, 'Must have at least 3 Purworejo pilot clinics');

  const kutoarjoClinics = await getClinicsByDistrict('Kutoarjo');
  assert.ok(kutoarjoClinics.every(c => c.district.toLowerCase() === 'kutoarjo'));

  const newCode = generateReferralCode('SEHAT');
  assert.match(newCode, /^PWR-SEHAT-[A-Z0-9]{6}$/);

  // Create
  const doc = await createDoctor({
    clinic_id: allClinics[0].id,
    full_name: 'dr. Test Sp.A',
    specialty: 'Anak',
    sip_number: 'SIP-TEST-001',
    daily_quota: 25
  });
  assert.strictEqual(doc.full_name, 'dr. Test Sp.A');
  assert.strictEqual(doc.status, 'aktif');

  // Update
  const updated = await updateDoctor(doc.id, {
    full_name: 'dr. Test Senior Sp.A',
    daily_quota: 30
  });
  assert.strictEqual(updated.full_name, 'dr. Test Senior Sp.A');
  assert.strictEqual(updated.daily_quota, 30);

  // Toggle Cuti
  const cutiRes = await toggleDoctorCuti(doc.id);
  assert.strictEqual(cutiRes.success, true);
  assert.strictEqual(cutiRes.status, 'cuti');

  // getDoctorsByClinic without cuti filter
  const allDocs = await getDoctorsByClinic(allClinics[0].id, true);
  assert.ok(allDocs.some(d => d.id === doc.id && d.status === 'cuti'));

  // getDoctorsByClinic with includeCuti = false
  const activeDocs = await getDoctorsByClinic(allClinics[0].id, false);
  assert.ok(!activeDocs.some(d => d.id === doc.id));

  // Toggle back to aktif
  const aktifRes = await toggleDoctorCuti(doc.id);
  assert.strictEqual(aktifRes.status, 'aktif');

  // Delete
  const delRes = await deleteDoctor(doc.id);
  assert.strictEqual(delRes.success, true);
  const remaining = await getDoctorsByClinic(allClinics[0].id, true);
  assert.ok(!remaining.some(d => d.id === doc.id));
});

test('pemilik.html provides clinic profile and doctor management interface', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pemilik.html'), 'utf8');
  assert.match(html, /id=["']clinic-referral-code["']/i);
  assert.match(html, /id=["']btn-copy-code["']/i);
  assert.match(html, /id=["']doctor-form["']/i);
  assert.match(html, /id=["']doctor-quota-input["']/i);
  // Verify Edit and Cuti modal / triggers
  assert.match(html, /modal-edit-doctor/i);
});
