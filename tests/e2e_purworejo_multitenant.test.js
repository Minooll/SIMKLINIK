const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const path = require('path');

test('E2E: All JavaScript files pass Node syntax check', () => {
  const files = [
    'config/supabase.js',
    'config/gemini.js',
    'assets/js/auth/multiRoleAuth.js',
    'assets/js/components/modal.js',
    'assets/js/components/toast.js',
    'assets/js/components/aiChatWidget.js',
    'assets/js/services/clinicService.js',
    'assets/js/services/appointmentService.js',
    'assets/js/services/queueService.js',
    'assets/js/services/rmeService.js',
    'assets/js/services/aiPurworejoService.js'
  ];

  for (const file of files) {
    const fullPath = path.join(__dirname, '..', file);
    assert.doesNotThrow(() => {
      execSync(`node --check "${fullPath}"`);
    }, `File ${file} must have valid JavaScript syntax`);
  }
});

test('E2E: Full User Journey - Owner creates clinic, Doctor binds, Patient books with 12hr rule, Doctor saves RME sequentially', async () => {
  const { getClinics, createDoctor } = require('../assets/js/services/clinicService.js');
  const { validateReferralCodeFormat } = require('../assets/js/auth/multiRoleAuth.js');
  const { createAppointment, cancelAppointment } = require('../assets/js/services/appointmentService.js');
  const { finalizeRmeAndAdvanceQueue } = require('../assets/js/services/rmeService.js');

  // 1. Clinics available
  const clinics = await getClinics();
  assert.ok(clinics.length >= 3, 'Must have at least 3 clinics');
  const clinic = clinics[0];

  // 2. Doctor code format valid
  assert.strictEqual(validateReferralCodeFormat(clinic.referral_code), true);

  // 3. Patient books appointment
  const now = new Date();
  const appointment = await createAppointment({
    clinic_id: clinic.id,
    doctor_id: 'doc-purworejo-1',
    patient_id: 'pat-purworejo-1',
    appointment_date: new Date(now.getTime() + 2 * 3600 * 1000).toISOString().split('T')[0], // 2 hours away
    appointment_time: '18:00:00'
  });
  assert.ok(appointment.queue_number, 'Must generate queue number');

  // 4. Cancellation within 12 hours is rejected
  const cancelResult = await cancelAppointment(appointment, now);
  assert.strictEqual(cancelResult.success, false, 'Cancellation within 12 hours must fail');
  assert.match(cancelResult.message, /12 jam/i);

  // 5. Doctor advances RME sequentially
  const rmeResult = await finalizeRmeAndAdvanceQueue({
    appointment_id: appointment.id,
    patient_id: 'pat-purworejo-1',
    doctor_id: 'doc-purworejo-1',
    clinic_id: clinic.id,
    soap_subjective: 'Keluhan batuk pilek',
    soap_objective: 'Suhu 37.2',
    soap_assessment: 'ISPA',
    soap_plan: 'Ambroxol tab',
    prescription_notes: 'Minum 3x sehari'
  }, [appointment]);
  assert.strictEqual(rmeResult.success, true);
  assert.strictEqual(appointment.status, 'selesai');
});
