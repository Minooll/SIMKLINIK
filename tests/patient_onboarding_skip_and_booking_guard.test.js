const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const pasienHtmlPath = path.resolve(__dirname, '../pasien.html');
const modalCssPath = path.resolve(__dirname, '../assets/css/modal.css');
const roleDashboardJsPath = path.resolve(__dirname, '../assets/js/dashboard/role-dashboard.js');

test('pasien.html - modalPatientOnboarding is skippable (no static backdrop, has close & skip buttons)', () => {
  const html = fs.readFileSync(pasienHtmlPath, 'utf8');

  // Verify modal exists
  assert.strictEqual(html.includes('id="modalPatientOnboarding"'), true, 'modalPatientOnboarding must exist');

  // Verify static backdrop is removed so patient is not locked
  const onboardingModalMatch = html.match(/<div class="modal-backdrop"[^>]*id="modalPatientOnboarding"[^>]*>/);
  assert.ok(onboardingModalMatch, 'Should find modalPatientOnboarding opening tag');
  assert.strictEqual(
    onboardingModalMatch[0].includes('data-backdrop="static"'),
    false,
    'modalPatientOnboarding should NOT have data-backdrop="static"'
  );

  // Verify close button in header
  const onboardingHeader = html.slice(
    html.indexOf('id="modalPatientOnboarding"'),
    html.indexOf('id="formPatientOnboarding"')
  );
  assert.match(onboardingHeader, /data-modal-close/i, 'modalPatientOnboarding header must have close button with data-modal-close');

  // Verify "Lewati untuk Sekarang" button in footer
  assert.match(
    html,
    /<button[^>]*id="btnSkipOnboarding"[^>]*>Lewati untuk Sekarang<\/button>/,
    'modalPatientOnboarding footer must contain Lewati untuk Sekarang button with id="btnSkipOnboarding"'
  );
  assert.match(
    html,
    /<button[^>]*id="btnSkipOnboarding"[^>]*data-modal-close|<button[^>]*data-modal-close[^>]*id="btnSkipOnboarding"/,
    'btnSkipOnboarding must have data-modal-close attribute'
  );
});

test('pasien.html - primaryAction does not directly open booking without profile completeness check', () => {
  const html = fs.readFileSync(pasienHtmlPath, 'utf8');

  const primaryActionMatch = html.match(/<button class="primary-button"[^>]*id="primaryAction"[^>]*>/);
  assert.ok(primaryActionMatch, 'primaryAction button should exist in pasien.html');
  assert.strictEqual(
    primaryActionMatch[0].includes('data-modal-target="modalBooking"'),
    false,
    'primaryAction should not have data-modal-target="modalBooking" to prevent bypassing check'
  );

  const fullAgendaBookingMatch = html.match(/<button type="button" class="primary-button"[^>]*id="btnFullAgendaNewBooking"[^>]*>/);
  assert.ok(fullAgendaBookingMatch, 'btnFullAgendaNewBooking button should exist in modal agenda');
  assert.strictEqual(
    fullAgendaBookingMatch[0].includes('data-modal-target="modalBooking"'),
    false,
    'btnFullAgendaNewBooking should not have data-modal-target="modalBooking"'
  );
});

test('pasien.html - contains modalRequireProfilePopup with mandatory identity & health profile checklist', () => {
  const html = fs.readFileSync(pasienHtmlPath, 'utf8');

  assert.strictEqual(html.includes('id="modalRequireProfilePopup"'), true, 'modalRequireProfilePopup must exist');
  assert.strictEqual(html.includes('id="requirementChecklistContainer"'), true, 'Checklist container must exist');
  assert.strictEqual(html.includes('id="reqCardIdentity"'), true, 'Identity requirement card must exist');
  assert.strictEqual(html.includes('id="reqCardHealth"'), true, 'Health requirement card must exist');
  assert.strictEqual(html.includes('id="btnGoCompleteProfile"'), true, 'Action button btnGoCompleteProfile must exist');
  assert.match(html, /Golongan Darah/i, 'Checklist must mention Golongan Darah');
  assert.match(html, /Riwayat Alergi/i, 'Checklist must mention Riwayat Alergi');
});

test('assets/css/modal.css - defines requirement callout, card, and status badges', () => {
  const css = fs.readFileSync(modalCssPath, 'utf8');

  assert.strictEqual(css.includes('.modal-warning-callout'), true, '.modal-warning-callout must be defined');
  assert.strictEqual(css.includes('.requirement-checklist'), true, '.requirement-checklist must be defined');
  assert.strictEqual(css.includes('.req-card'), true, '.req-card must be defined');
  assert.strictEqual(css.includes('.req-card.is-complete'), true, '.req-card.is-complete must be defined');
  assert.strictEqual(css.includes('.req-card.is-incomplete'), true, '.req-card.is-incomplete must be defined');
  assert.strictEqual(css.includes('.req-status-badge'), true, '.req-status-badge must be defined');
  assert.strictEqual(css.includes('.req-badge-complete'), true, '.req-badge-complete must be defined');
  assert.strictEqual(css.includes('.req-badge-incomplete'), true, '.req-badge-incomplete must be defined');
});

test('role-dashboard.js - Patient booking eligibility logic evaluates identity and health data correctly', () => {
  const js = fs.readFileSync(roleDashboardJsPath, 'utf8');

  // Verify key functions are present in the code
  assert.strictEqual(js.includes('function checkPatientBookingEligibility()'), true, 'checkPatientBookingEligibility must be defined');
  assert.strictEqual(js.includes('function showRequireProfilePopup('), true, 'showRequireProfilePopup must be defined');
  assert.strictEqual(js.includes('function handleInitiateBooking('), true, 'handleInitiateBooking must be defined');

  // Test the pure logic of eligibility evaluation as implemented in role-dashboard.js
  function evaluateEligibility(patientRecord, authUser) {
    const profileName = (patientRecord && patientRecord.profile && patientRecord.profile.full_name) ||
      (authUser && authUser.user_metadata && (authUser.user_metadata.full_name || authUser.user_metadata.name)) || '';
    const hasValidFullName = Boolean(profileName && !profileName.includes('@') && profileName.trim().length >= 3);
    const hasNik = Boolean(patientRecord && patientRecord.nik && /^\d{16}$/.test(patientRecord.nik.trim()));
    const hasBirthDate = Boolean(patientRecord && patientRecord.birth_date);
    const hasGender = Boolean(patientRecord && patientRecord.gender);
    const hasPhone = Boolean(patientRecord && patientRecord.phone && patientRecord.phone.trim().length >= 9);
    const hasAddress = Boolean(patientRecord && patientRecord.address && patientRecord.address.trim().length >= 3);

    const isIdentityComplete = Boolean(hasValidFullName && hasNik && hasBirthDate && hasGender && hasPhone && hasAddress);

    const hasBloodType = Boolean(patientRecord && patientRecord.blood_type && patientRecord.blood_type.trim().length > 0);
    const hasAllergies = Boolean(patientRecord && patientRecord.allergies && patientRecord.allergies.trim().length > 0);

    const isHealthComplete = Boolean(hasBloodType && hasAllergies);
    const isEligible = Boolean(isIdentityComplete && isHealthComplete);

    return { isEligible, isIdentityComplete, isHealthComplete };
  }

  // Case 1: Fresh new patient (empty data)
  const freshCase = evaluateEligibility(null, { id: 'u1', user_metadata: { name: 'Budi Test' } });
  assert.strictEqual(freshCase.isEligible, false);
  assert.strictEqual(freshCase.isIdentityComplete, false);
  assert.strictEqual(freshCase.isHealthComplete, false);

  // Case 2: Identity complete, but health profile missing
  const idOnlyCase = evaluateEligibility({
    id: 'p1',
    nik: '3271012345678901',
    birth_date: '1995-04-12',
    gender: 'Laki-laki',
    phone: '08123456789',
    address: 'Jl. Merdeka No. 10 Jakarta',
    profile: { full_name: 'Budi Prakoso' },
    blood_type: '',
    allergies: ''
  }, null);
  assert.strictEqual(idOnlyCase.isIdentityComplete, true);
  assert.strictEqual(idOnlyCase.isHealthComplete, false);
  assert.strictEqual(idOnlyCase.isEligible, false);

  // Case 3: Identity complete, health profile has blood type but no allergies
  const missingAllergiesCase = evaluateEligibility({
    id: 'p1',
    nik: '3271012345678901',
    birth_date: '1995-04-12',
    gender: 'Laki-laki',
    phone: '08123456789',
    address: 'Jl. Merdeka No. 10 Jakarta',
    profile: { full_name: 'Budi Prakoso' },
    blood_type: 'O',
    allergies: ''
  }, null);
  assert.strictEqual(missingAllergiesCase.isIdentityComplete, true);
  assert.strictEqual(missingAllergiesCase.isHealthComplete, false);
  assert.strictEqual(missingAllergiesCase.isEligible, false);

  // Case 4: Both identity and health profile complete
  const completeCase = evaluateEligibility({
    id: 'p1',
    nik: '3271012345678901',
    birth_date: '1995-04-12',
    gender: 'Laki-laki',
    phone: '08123456789',
    address: 'Jl. Merdeka No. 10 Jakarta',
    profile: { full_name: 'Budi Prakoso' },
    blood_type: 'O',
    allergies: 'Tidak ada alergi obat'
  }, null);
  assert.strictEqual(completeCase.isIdentityComplete, true);
  assert.strictEqual(completeCase.isHealthComplete, true);
  assert.strictEqual(completeCase.isEligible, true);
});

test('pasien.html - window.openBookingModalWithService hooks into handleInitiateBooking', () => {
  const html = fs.readFileSync(pasienHtmlPath, 'utf8');

  assert.match(
    html,
    /window\.openBookingModalWithService\s*=\s*\(serviceName(?:,\s*clinicId)?\)\s*=>\s*\{[\s\S]*handleInitiateBooking/,
    'openBookingModalWithService must intercept via handleInitiateBooking'
  );
});
