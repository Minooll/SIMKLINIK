const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  getClinics,
  getDoctorsByClinic,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorCuti
} = require('../assets/js/services/clinicService.js');

test('Pemilik: Dokter management CRUD & Cuti flow', async () => {
  const clinics = await getClinics();
  const clinicId = clinics[0].id;

  // 1. Tambah Dokter
  const newDoc = await createDoctor({
    clinic_id: clinicId,
    full_name: 'dr. Satrio Wibowo',
    specialty: 'Dokter Umum',
    sip_number: 'SIP-PWR-099/2026',
    daily_quota: 18
  });
  assert.strictEqual(newDoc.status, 'aktif');
  assert.strictEqual(newDoc.full_name, 'dr. Satrio Wibowo');

  // 2. Edit Dokter
  const updatedDoc = await updateDoctor(newDoc.id, {
    full_name: 'dr. Satrio Wibowo, Sp.A',
    specialty: 'Spesialis Anak',
    daily_quota: 22
  });
  assert.strictEqual(updatedDoc.full_name, 'dr. Satrio Wibowo, Sp.A');
  assert.strictEqual(updatedDoc.specialty, 'Spesialis Anak');
  assert.strictEqual(updatedDoc.daily_quota, 22);

  // 3. Set Dokter Cuti
  const cutiRes = await toggleDoctorCuti(newDoc.id);
  assert.strictEqual(cutiRes.status, 'cuti');

  // Booking filtering: dokter cuti tidak muncul jika includeCuti false
  const bookableDocs = await getDoctorsByClinic(clinicId, false);
  assert.ok(!bookableDocs.some(d => d.id === newDoc.id), 'Dokter cuti tidak boleh muncul di daftar reservasi aktif');

  // Owner dashboard: dokter cuti tetap muncul di daftar lengkap pemilik klinik
  const allDocsForOwner = await getDoctorsByClinic(clinicId, true);
  assert.ok(allDocsForOwner.some(d => d.id === newDoc.id && d.status === 'cuti'));

  // 4. Aktifkan kembali dari Cuti
  const aktifRes = await toggleDoctorCuti(newDoc.id);
  assert.strictEqual(aktifRes.status, 'aktif');

  // 5. Hapus Dokter
  const delRes = await deleteDoctor(newDoc.id);
  assert.strictEqual(delRes.success, true);
  const remainingDocs = await getDoctorsByClinic(clinicId, true);
  assert.ok(!remainingDocs.some(d => d.id === newDoc.id));
});

test('Pemilik HTML: Memiliki tab views terpisah dan tombol manajemen dokter (Edit, Cuti, Hapus)', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pemilik.html'), 'utf8');

  // Tab navigation & separated views
  assert.match(html, /data-view=["']view-profil-klinik["']/i);
  assert.match(html, /data-view=["']view-kelola-dokter["']/i);
  assert.match(html, /data-view=["']view-statistik["']/i);

  assert.match(html, /id=["']view-profil-klinik["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-kelola-dokter["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-statistik["']\s+class=["'][^"']*dashboard-view/i);

  // Action buttons & Modals
  assert.match(html, /modal-edit-doctor/i);
  assert.match(html, /modal-add-doctor/i);
  assert.match(html, /openEditDoctorModal/i);
  assert.match(html, /handleToggleCuti/i);
  assert.match(html, /handleDeleteDoctor/i);
});

test('Pasien HTML: Memiliki pemisahan konten navbar dan dashboard menjadi tab views mandiri', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf8');

  // Separated views
  assert.match(html, /data-view=["']view-katalog["']/i);
  assert.match(html, /data-view=["']view-antrean["']/i);
  assert.match(html, /data-view=["']view-rme["']/i);
  assert.match(html, /data-view=["']view-profil["']/i);

  assert.match(html, /id=["']view-katalog["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-antrean["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-rme["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-profil["']\s+class=["'][^"']*dashboard-view/i);

  // Doctor cuti detection in booking
  assert.match(html, /\[SEDANG CUTI\]/i);
});

test('Dokter HTML: Memiliki pemisahan tab view (Ruang Periksa, Antrean Lengkap, Arsip RME)', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dokter.html'), 'utf8');

  assert.match(html, /data-view=["']view-ruang-periksa["']/i);
  assert.match(html, /data-view=["']view-antrean-lengkap["']/i);
  assert.match(html, /data-view=["']view-arsip-rme["']/i);

  assert.match(html, /id=["']view-ruang-periksa["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-antrean-lengkap["']\s+class=["'][^"']*dashboard-view/i);
  assert.match(html, /id=["']view-arsip-rme["']\s+class=["'][^"']*dashboard-view/i);
});
