const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('pasien.html has mandatory profile onboarding modal, clinic explorer, and queue ticket with live countdown', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf8');

  // Mandatory profile onboarding elements
  assert.match(html, /id=["']modal-profile-onboarding["']/i);
  assert.match(html, /id=["']input-no-kk["']/i);
  assert.match(html, /id=["']input-nik["']/i);
  assert.match(html, /id=["']input-blood-type["']/i);
  assert.match(html, /id=["']input-allergies["']/i);

  // Purworejo clinic catalogue & district filter
  assert.match(html, /id=["']district-filter["']/i);
  assert.match(html, /id=["']clinic-grid["']/i);

  // 12-hour warning in booking modal
  assert.match(html, /12 jam/i);

  // Live queue & medical record tabs
  assert.match(html, /id=["']live-ticket-card["']/i);
  assert.match(html, /id=["']rme-history-list["']/i);

  // Live countdown timer in queue ticket
  assert.match(html, /id=["']queue-countdown-box["']/i);
  assert.match(html, /id=["']queue-countdown-timer["']/i);
  assert.match(html, /startLiveQueueCountdown/i);
});
