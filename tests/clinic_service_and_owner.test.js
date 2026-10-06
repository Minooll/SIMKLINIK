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
  toggleDoctorCuti,
  setDoctorCuti,
  endDoctorCuti,
  isDoctorOnLeave,
  toDateString,
  formatCutiDateIndo
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

test('clinicService: Detailed cuti presets, calendar ranges, and real-world automatic expiration', async () => {
  const allClinics = await getClinics();
  const clinicId = allClinics[0].id;

  const testDoctor = await createDoctor({
    clinic_id: clinicId,
    full_name: 'dr. Cuti Otomatis Sp.PD',
    specialty: 'Spesialis Penyakit Dalam',
    sip_number: 'SIP-TEST-CUTI/2026',
    daily_quota: 20
  });

  // 1. Set Cuti 2 Hari mulai 2026-10-06 s/d 2026-10-07
  const setRes = await setDoctorCuti(testDoctor.id, {
    startDate: '2026-10-06',
    endDate: '2026-10-07',
    reason: 'Seminar Medis Kardiologi'
  });
  assert.strictEqual(setRes.success, true);
  assert.strictEqual(setRes.status, 'cuti');
  assert.strictEqual(setRes.cuti_start, '2026-10-06');
  assert.strictEqual(setRes.cuti_end, '2026-10-07');
  assert.strictEqual(setRes.cuti_reason, 'Seminar Medis Kardiologi');

  // 2. Pada masa cuti (2026-10-06): dokter terdeteksi cuti
  const onLeaveDuring = isDoctorOnLeave(testDoctor, new Date('2026-10-06'));
  assert.strictEqual(onLeaveDuring, true);

  // Pada 2026-10-07 (hari terakhir cuti): masih cuti
  const onLeaveLastDay = isDoctorOnLeave(testDoctor, new Date('2026-10-07'));
  assert.strictEqual(onLeaveLastDay, true);

  // Dokter tidak muncul di list booking pasien pada tanggal cuti (includeCuti = false)
  const bookableDuring = await getDoctorsByClinic(clinicId, false, new Date('2026-10-06'));
  assert.ok(!bookableDuring.some(d => d.id === testDoctor.id));

  // 3. SETELAH TANGGAL CUTI BERAKHIR DI DUNIA NYATA (2026-10-08):
  // Sistem otomatis mengaktifkan kembali dokter tanpa intervensi manual!
  const onLeaveAfter = isDoctorOnLeave(testDoctor, new Date('2026-10-08'));
  assert.strictEqual(onLeaveAfter, false, 'Dokter harus otomatis kembali aktif saat tanggal cuti berakhir');
  assert.strictEqual(testDoctor.status, 'aktif', 'Status dokter harus otomatis berubah menjadi aktif');

  // Sekarang dokter kembali muncul dan bisa dipilih oleh pasien!
  const bookableAfter = await getDoctorsByClinic(clinicId, false, new Date('2026-10-08'));
  assert.ok(bookableAfter.some(d => d.id === testDoctor.id), 'Dokter yang cutinya sudah berakhir harus otomatis bisa dipilih pasien');

  // 4. Test Preset Durasi (Misal 1 Hari)
  const oneDayRes = await setDoctorCuti(testDoctor.id, {
    startDate: '2026-10-10',
    durationDays: 1,
    reason: 'Izin Pribadi 1 Hari'
  });
  assert.strictEqual(oneDayRes.cuti_start, '2026-10-10');
  assert.strictEqual(oneDayRes.cuti_end, '2026-10-10');

  // 5. Test Akhiri Cuti Lebih Awal (endDoctorCuti)
  const endRes = await endDoctorCuti(testDoctor.id);
  assert.strictEqual(endRes.success, true);
  assert.strictEqual(endRes.status, 'aktif');
  assert.strictEqual(isDoctorOnLeave(testDoctor, new Date('2026-10-10')), false);

  // Bersihkan data tes
  await deleteDoctor(testDoctor.id);
});

test('pemilik.html provides clinic profile and doctor management interface with detailed cuti modal', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pemilik.html'), 'utf8');
  assert.match(html, /id=["']clinic-referral-code["']/i);
  assert.match(html, /id=["']btn-copy-code["']/i);
  assert.match(html, /id=["']doctor-form["']/i);
  assert.match(html, /id=["']doctor-quota-input["']/i);

  // Verify Edit and Cuti modals
  assert.match(html, /modal-edit-doctor/i);
  assert.match(html, /modal-set-cuti/i);
  assert.match(html, /form-set-cuti/i);
  assert.match(html, /cuti-quick-chips/i);
  assert.match(html, /cuti-start-date/i);
  assert.match(html, /cuti-end-date/i);
  assert.match(html, /cuti-reason-select/i);
  assert.match(html, /btn-end-cuti-now/i);
});

