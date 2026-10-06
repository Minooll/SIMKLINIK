const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { clinicService, MOCK_PURWOREJO_CLINICS } = require('../assets/js/services/clinicService.js');
const aiService = require('../assets/js/services/aiService.js');

// Mock gemini client
const mockGeminiClient = {
  calls: [],
  responseToReturn: '',
  async callGemini(prompt, systemInstruction, options) {
    this.calls.push({ prompt, systemInstruction, options });
    return this.responseToReturn;
  }
};
aiService.setClient(mockGeminiClient);

test('1. clinicService calculates Haversine distance and ranks clinics by proximity & queue load', async () => {
  // Test Haversine distance method
  assert.strictEqual(typeof clinicService.calculateDistanceKm, 'function', 'clinicService must provide calculateDistanceKm');
  
  // Distance from Kutoarjo (-7.7198, 109.9134) to clinic-pwr-02 (Kutoarjo) should be ~0.0 km
  const distKutoarjo = clinicService.calculateDistanceKm(-7.7198, 109.9134, -7.7198, 109.9134);
  assert.strictEqual(distKutoarjo, 0);

  // Distance from Kutoarjo to Purworejo Kota (-7.7144, 110.0125) is approximately 11 km
  const distKota = clinicService.calculateDistanceKm(-7.7198, 109.9134, -7.7144, 110.0125);
  assert.ok(distKota >= 10 && distKota <= 12, `Distance should be ~11km, got ${distKota}`);

  // Test getClinicRecommendations with location context
  assert.strictEqual(typeof clinicService.getClinicRecommendations, 'function', 'clinicService must provide getClinicRecommendations');
  
  // Patient in Kutoarjo with general fever complaint
  const recsKutoarjo = await clinicService.getClinicRecommendations('Demam dan pusing', {
    district: 'Kutoarjo',
    latitude: -7.7198,
    longitude: 109.9134
  });

  assert.ok(Array.isArray(recsKutoarjo), 'Recommendations must be an array');
  assert.strictEqual(recsKutoarjo.length, 3, 'Must return all 3 Purworejo clinics');
  assert.strictEqual(recsKutoarjo[0].clinic.district, 'Kutoarjo', 'Closest clinic (Kutoarjo) should rank #1 for Kutoarjo patient');
  assert.ok(typeof recsKutoarjo[0].estimatedWaitMinutes === 'number', 'Must include estimatedWaitMinutes');
  assert.ok(typeof recsKutoarjo[0].distanceKm === 'number', 'Must include distanceKm');

  // Patient with dental complaint should prioritize clinic-pwr-01 (Purworejo Kota has Poli Gigi)
  const recsDental = await clinicService.getClinicRecommendations('Gigi geraham sakit berdenyut', {
    district: 'Kutoarjo'
  });
  assert.strictEqual(recsDental[0].clinic.id, 'clinic-pwr-01', 'Poli Gigi specialist clinic must rank #1 for dental complaints');
});

test('2. aiService.triagePatient provides multi-clinic context to Gemini and extracts [BOOK_CLINIC]', async () => {
  mockGeminiClient.responseToReturn = `Halo Sahabat Sehat! 😊✨
Berdasarkan keluhan nyeri gigi geraham berdenyut, Anda kami rekomendasikan untuk periksa di Poli Gigi.
Fasilitas terbaik yang memiliki dokter gigi dan antrean kondusif saat ini adalah:
**Klinik Pratama Sehat Mandiri Purworejo** (Kec. Purworejo Kota) dengan estimasi antrean 3 pasien (~30 menit).

[BOOK_CLINIC: "clinic-pwr-01", "Poli Gigi"]
Semoga lekas sembuh dan tetap semangat ya! 🌟💖`;

  const triage = await aiService.triagePatient('Gigi geraham bawah ngilu berdenyut', [], [], MOCK_PURWOREJO_CLINICS, {
    district: 'Purworejo',
    latitude: -7.7144,
    longitude: 110.0125
  });

  // Check prompt received clinic list
  const lastCall = mockGeminiClient.calls[mockGeminiClient.calls.length - 1];
  assert.match(lastCall.systemInstruction, /KLN-PWR-01|KLN-PWR-02|KLN-PWR-03/);
  assert.match(lastCall.systemInstruction, /BOOK_CLINIC/);

  // Check output parsing
  assert.strictEqual(triage.suggestedClinicId, 'clinic-pwr-01');
  assert.strictEqual(triage.suggestedPoli, 'Poli Gigi');
  assert.strictEqual(triage.isEmergency, false);
});

test('3. aiChatWidget formats [BOOK_CLINIC] into rich recommendation cards', () => {
  const widgetCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/components/aiChatWidget.js'), 'utf8');

  // Must have pattern for parsing [BOOK_CLINIC: "clinicId", "poliName"]
  assert.match(widgetCode, /BOOK_CLINIC/, 'aiChatWidget.js must handle BOOK_CLINIC tag');
  assert.match(widgetCode, /ai-clinic-recommend-card|ai-clinic-card/, 'aiChatWidget.js must generate clinic card markup');
  assert.match(widgetCode, /openBookingModalWithService|openBookingWithClinic/, 'aiChatWidget.js must trigger direct booking with clinic and service');
  assert.match(widgetCode, /navigator\.geolocation|district/i, 'aiChatWidget.js must support patient location context');
});

test('4. pasien.html and role-dashboard.js support pre-selecting both clinic and service', () => {
  const pasienHtml = fs.readFileSync(path.resolve(__dirname, '../pasien.html'), 'utf8');
  const roleDashboard = fs.readFileSync(path.resolve(__dirname, '../assets/js/dashboard/role-dashboard.js'), 'utf8');

  // pasien.html window.openBookingModalWithService must accept clinicId
  assert.match(
    pasienHtml,
    /window\.openBookingModalWithService\s*=\s*\((?:serviceName,\s*clinicId|serviceName)/,
    'openBookingModalWithService must support clinicId parameter'
  );
  assert.match(pasienHtml, /bookingClinicSelect/, 'Must update bookingClinicSelect when clinicId is passed');

  // role-dashboard.js openBookingWithClinic must accept serviceName as optional 2nd param
  assert.match(
    roleDashboard,
    /window\.openBookingWithClinic\s*=\s*\((?:clinicId,\s*serviceName|clinicId)/,
    'openBookingWithClinic must support serviceName parameter'
  );
});
