const test = require('node:test');
const assert = require('node:assert/strict');

// Load services
const appointmentService = require('../assets/js/services/appointmentService.js');
const medicalRecordService = require('../assets/js/services/medicalRecordService.js');
const prescriptionService = require('../assets/js/services/prescriptionService.js');

test('appointmentService - getAllDoctorsWithSchedules provides normalized non-undefined fields', () => {
  const doctors = appointmentService.getAllDoctorsWithSchedules();
  assert.ok(Array.isArray(doctors), 'Should return an array of doctors');
  assert.ok(doctors.length > 0, 'Should contain master doctors');

  doctors.forEach(doc => {
    // 1. Doctor name must not be undefined
    assert.ok(doc.full_name, `Doctor id ${doc.id} must have full_name`);
    assert.notEqual(doc.full_name, 'undefined');
    assert.ok(doc.profile?.full_name, `Doctor id ${doc.id} must have profile.full_name`);

    // 2. Service name / Poliklinik must not be undefined
    assert.ok(doc.service_name, `Doctor id ${doc.id} must have service_name`);
    assert.notEqual(doc.service_name, 'undefined');
    assert.ok(doc.service?.name, `Doctor id ${doc.id} must have service.name`);

    // 3. Schedule must have valid hours, days, room, and quota
    assert.ok(doc.schedule, `Doctor id ${doc.id} must have schedule`);
    assert.ok(doc.schedule.days, `Doctor id ${doc.id} schedule.days must exist`);
    assert.ok(doc.schedule.hours, `Doctor id ${doc.id} schedule.hours must exist`);
    assert.notEqual(doc.schedule.hours, 'undefined');
    assert.ok(doc.schedule.start_time, `Doctor id ${doc.id} schedule.start_time must exist`);
    assert.notEqual(doc.schedule.start_time, 'undefined');
    assert.ok(doc.schedule.end_time, `Doctor id ${doc.id} schedule.end_time must exist`);
    assert.notEqual(doc.schedule.end_time, 'undefined');
  });
});

test('appointmentService - dummy sample appointments removed, preserves empty real state', async () => {
  const doctorToday = await appointmentService.getDoctorTodayAppointments('11111111-1111-4111-8111-111111111111');
  assert.ok(doctorToday.success);
  assert.deepEqual(doctorToday.data, [], 'Should return empty array when no active appointments booked');

  const allClinic = await appointmentService.getAllClinicAppointments();
  assert.ok(allClinic.success);
  assert.deepEqual(allClinic.data, [], 'Should return empty array when no active clinic bookings exist');
});

test('medicalRecordService & prescriptionService - dummy fallbacks removed', async () => {
  const records = await medicalRecordService.getDoctorRecords('11111111-1111-4111-8111-111111111111');
  assert.ok(records.success);
  assert.deepEqual(records.data, [], 'Should return empty array instead of dummy SOAP patients');

  const rx = await prescriptionService.getDoctorPrescriptions('11111111-1111-4111-8111-111111111111');
  assert.ok(rx.success);
  assert.deepEqual(rx.data, [], 'Should return empty array instead of dummy prescription items');
});
