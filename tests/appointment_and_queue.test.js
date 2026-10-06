const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isCancellationAllowed,
  createAppointment,
  cancelAppointment,
  getDoctorQueueToday
} = require('../assets/js/services/appointmentService.js');
const { getCrowdStatus } = require('../assets/js/services/queueService.js');

test('appointmentService enforces strict 12-hour cancellation rule', () => {
  const now = new Date('2026-10-06T10:00:00');

  // Case 1: Appointment is 24 hours in future -> ALLOWED
  const futureDate = new Date(now.getTime() + 24 * 3600 * 1000);
  const dateStrFuture = futureDate.toISOString().split('T')[0];
  const timeStrFuture = '10:00:00';
  assert.strictEqual(isCancellationAllowed(dateStrFuture, timeStrFuture, now), true);

  // Case 2: Appointment is 6 hours in future -> BLOCKED (< 12 hours)
  const soonDate = new Date(now.getTime() + 6 * 3600 * 1000);
  const dateStrSoon = soonDate.toISOString().split('T')[0];
  const timeStrSoon = `${String(soonDate.getHours()).padStart(2, '0')}:${String(soonDate.getMinutes()).padStart(2, '0')}:00`;
  assert.strictEqual(isCancellationAllowed(dateStrSoon, timeStrSoon, now), false);

  // Case 3: Appointment is 11.5 hours in future -> BLOCKED
  const elevenHoursDate = new Date(now.getTime() + 11.5 * 3600 * 1000);
  const dateStrEleven = elevenHoursDate.toISOString().split('T')[0];
  const timeStrEleven = `${String(elevenHoursDate.getHours()).padStart(2, '0')}:${String(elevenHoursDate.getMinutes()).padStart(2, '0')}:00`;
  assert.strictEqual(isCancellationAllowed(dateStrEleven, timeStrEleven, now), false);
});

test('cancelAppointment rejects appointments within 12 hours', async () => {
  const now = new Date('2026-10-06T10:00:00');
  const soonDate = new Date(now.getTime() + 4 * 3600 * 1000);
  const appt = {
    id: 'appt-test-12hr',
    appointment_date: soonDate.toISOString().split('T')[0],
    appointment_time: '14:00:00',
    status: 'menunggu'
  };

  const result = await cancelAppointment(appt, now);
  assert.strictEqual(result.success, false);
  assert.match(result.message, /12 jam/i);
});

test('queueService computes crowd status properly', () => {
  assert.strictEqual(getCrowdStatus(3), 'lengang');
  assert.strictEqual(getCrowdStatus(7), 'sedang');
  assert.strictEqual(getCrowdStatus(15), 'padat');
});
