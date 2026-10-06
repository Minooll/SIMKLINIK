const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { finalizeRmeAndAdvanceQueue, getPatientMedicalRecords } = require('../assets/js/services/rmeService.js');

test('rmeService atomics: finalizes current appointment, advances queue, loads next patient', async () => {
  const queueData = [
    { id: 'appt-1', patient_id: 'pat-1', queue_order: 1, status: 'sedang_diperiksa' },
    { id: 'appt-2', patient_id: 'pat-2', queue_order: 2, status: 'menunggu' }
  ];

  const soapPayload = {
    appointment_id: 'appt-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    clinic_id: 'clinic-1',
    soap_subjective: 'Demam 3 hari',
    soap_objective: 'TD 120/80, Suhu 38.5C',
    soap_assessment: 'Febris Akut ec Viral Infection (A09)',
    soap_plan: 'Paracetamol 500mg 3x1',
    prescription_notes: 'Banyak minum air putih'
  };

  const result = await finalizeRmeAndAdvanceQueue(soapPayload, queueData);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.has_next, true);
  assert.strictEqual(result.next_appointment_id, 'appt-2');
  assert.strictEqual(queueData[0].status, 'selesai');
  assert.strictEqual(queueData[1].status, 'sedang_diperiksa');
});

test('dokter.html contains SOAP form elements, finish button, and live queue display', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dokter.html'), 'utf8');
  assert.match(html, /id=["']soap-subjective["']/i);
  assert.match(html, /id=["']soap-objective["']/i);
  assert.match(html, /id=["']soap-assessment["']/i);
  assert.match(html, /id=["']btn-finalize-rme["']/i);
  assert.match(html, /id=["']today-queue-list["']/i);

  // Layout vertikal atas-bawah memprioritaskan penulisan RME di posisi atas
  assert.match(html, /class=["'][^"']*doctor-workspace-vertical/i);
  assert.match(html, /class=["'][^"']*rme-primary-workspace/i);
  assert.match(html, /class=["'][^"']*queue-secondary-workspace/i);

  // Pastikan RME muncul sebelum antrean di dokumen HTML
  const rmePos = html.indexOf('rme-primary-workspace');
  const queuePos = html.indexOf('queue-secondary-workspace');
  assert.ok(rmePos < queuePos, 'RME workspace must precede queue list in vertical top-to-bottom layout');
});
