const test = require('node:test');
const assert = require('node:assert');

const appointmentService = require('../assets/js/services/appointmentService.js');
const medicalRecordService = require('../assets/js/services/medicalRecordService.js');

test('canCancelAppointment allows cancellation when schedule is more than 12 hours away', () => {
  const now = new Date('2026-10-06T10:00:00Z');
  const apptDate = '2026-10-07';
  const apptTime = '10:00:00'; // 24 hours away

  const result = appointmentService.canCancelAppointment(apptDate, apptTime, now);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.hoursRemaining >= 12, true);
  assert.strictEqual(result.reason, null);
});

test('canCancelAppointment blocks cancellation when schedule is less than 12 hours away', () => {
  const now = new Date('2026-10-06T10:00:00');
  const apptDate = '2026-10-06';
  const apptTime = '16:00:00'; // 6 hours away

  const result = appointmentService.canCancelAppointment(apptDate, apptTime, now);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.hoursRemaining < 12, true);
  assert.match(result.reason, /hanya dapat dibatalkan.*12 jam/i);
});

test('canCancelAppointment blocks cancellation for past appointments', () => {
  const now = new Date('2026-10-06T15:00:00');
  const apptDate = '2026-10-06';
  const apptTime = '09:00:00'; // past

  const result = appointmentService.canCancelAppointment(apptDate, apptTime, now);
  assert.strictEqual(result.allowed, false);
  assert.match(result.reason, /jadwal konsultasi sudah lewat|hanya dapat dibatalkan.*12 jam/i);
});

test('cancelAppointment rejects cancellation within 12-hour window', async () => {
  const now = new Date('2026-10-06T12:00:00');
  const appt = {
    id: 'appt-test-1',
    appointment_date: '2026-10-06',
    appointment_time: '18:00:00', // 6 hours away
    status: 'Terjadwal'
  };

  const res = await appointmentService.cancelAppointment(appt, 'pasien', now);
  assert.strictEqual(res.success, false);
  assert.match(res.error, /12 jam/i);
});

test('cancelAppointment succeeds when canceled more than 12 hours prior', async () => {
  const now = new Date('2026-10-06T08:00:00');
  const appt = {
    id: 'appt-test-2',
    appointment_date: '2026-10-07',
    appointment_time: '09:00:00', // > 24 hours away
    status: 'Terjadwal'
  };

  const res = await appointmentService.cancelAppointment(appt, 'pasien', now);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.status, 'Dibatalkan');
});

test('getLatestMedicalRecord extracts the most recent record with prescription summary', () => {
  const records = [
    {
      id: 'rec-1',
      created_at: '2026-08-01T10:00:00Z',
      doctor: { profile: { full_name: 'dr. Ayu' } },
      diagnosis: 'Hipertensi',
      prescription: { items: [{ name: 'Amlodipine 5mg', dosage: '1x1' }] }
    },
    {
      id: 'rec-2',
      created_at: '2026-09-18T08:30:00Z',
      doctor: { profile: { full_name: 'dr. Dimas' } },
      diagnosis: 'Migrain Akut',
      prescription: { items: [{ name: 'Paracetamol 500mg', dosage: '3x1' }, { name: 'Vitamin B Kompleks', dosage: '1x1' }] }
    },
    {
      id: 'rec-3',
      created_at: '2026-05-15T09:00:00Z',
      doctor: { profile: { full_name: 'drg. Cynthia' } },
      diagnosis: 'Pembersihan karang gigi'
    }
  ];

  const latest = medicalRecordService.extractLatestRecord(records);
  assert.strictEqual(latest.id, 'rec-2');
  assert.strictEqual(latest.diagnosis, 'Migrain Akut');
  assert.strictEqual(latest.doctor.profile.full_name, 'dr. Dimas');
  assert.strictEqual(latest.prescription.items.length, 2);
});

test('canCancelAppointment correctly parses Indonesian text date formats (e.g. "26 Sep 2026")', () => {
  const now = new Date('2026-09-26T00:00:00');
  const apptDate = '26 Sep 2026';
  const apptTime = '14:00:00'; // 14 hours away

  const res = appointmentService.canCancelAppointment(apptDate, apptTime, now);
  assert.strictEqual(res.allowed, true);
  assert.strictEqual(res.hoursRemaining >= 12, true);

  // If only 4 hours away:
  const nowClose = new Date('2026-09-26T10:00:00');
  const resClose = appointmentService.canCancelAppointment(apptDate, apptTime, nowClose);
  assert.strictEqual(resClose.allowed, false);
  assert.strictEqual(resClose.hoursRemaining < 12, true);
  assert.match(resClose.reason, /12 jam/i);
});

test('pasien.html contains 12-hour cancellation notice in modalBooking and latestRmeContainer in lower-panel', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf-8');

  // Verify policy notice in modalBooking
  assert.match(html, /id="bookingCancellationNotice"/);
  assert.match(html, /12 jam/i);
  assert.match(html, /kebijakan|ketentuan pembatalan/i);

  // Verify latest RME container in lower panel
  assert.match(html, /id="latestRmeContainer"/);
  assert.match(html, /id="lowerTableWrap"/);
});

test('CSS files define grey action-btn-locked, latest-rme-card, and AI explainer styles', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/role-pages.css'), 'utf-8');
  const modalCss = fs.readFileSync(path.join(__dirname, '../assets/css/modal.css'), 'utf-8');

  // Grey button styling
  assert.match(css, /\.action-btn-locked/);
  assert.match(css, /background:\s*#f1f5f9/);
  assert.match(css, /cursor:\s*pointer/);

  // Modal policy notice styling
  assert.match(modalCss, /\.modal-policy-notice/);

  // Latest RME card, rx box, and AI Medication Explainer button
  assert.match(css, /\.latest-rme-card/);
  assert.match(css, /\.btn-ai-explain-med-primary/);
  assert.match(css, /\.latest-rme-rx-box/);
});

test('role-dashboard.js exposes cancellation and AI medication explainer helpers', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const js = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'), 'utf-8');

  assert.match(js, /window\.showCancelLockedNotice/);
  assert.match(js, /window\.handleCancelAppointment/);
  assert.match(js, /window\.openMedicationExplainer/);
  assert.match(js, /action-btn-locked/);
  assert.match(js, /btn-ai-explain-med-primary/);
  // Tebus obat button is removed from latest RME card
  assert.doesNotMatch(js, /<button class="btn-buy-medication">/);
});
