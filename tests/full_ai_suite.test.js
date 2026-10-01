const test = require('node:test');
const assert = require('node:assert');

const aiService = require('../assets/js/services/aiService.js');
const { buildGeminiPayload } = require('../config/gemini.js');

test('E2E Verification: Triage, Explainer, SOAP, Safety, FAQ, and Analytics', async () => {
  const mockClient = {
    async callGemini(prompt, systemInstruction) {
      if (systemInstruction.includes('Nayla')) {
        return 'Triage: Ringan. Keluhan batuk biasa. [BOOK_POLI: "Poli Umum"]';
      }
      if (systemInstruction.includes('Apoteker')) {
        return 'Fungsi Obat: Antibiotik untuk membunuh bakteri. Aturan: 3x sehari sebelum makan.';
      }
      if (systemInstruction.includes('Permenkes No. 24')) {
        return JSON.stringify({
          subjective: 'Demam 3 hari',
          objective: 'Suhu 38.5C, faring hiperemis',
          assessment: 'Faringitis Akut',
          icd10: 'J02.9',
          plan: 'Tirah baring, amoxicillin 3x500mg'
        });
      }
      if (systemInstruction.includes('Pharmacovigilance')) {
        return JSON.stringify({
          hasRisk: true,
          severity: 'SEDANG',
          warning: 'Potensi reaksi silang dengan golongan Penisilin.',
          recommendation: 'Ganti antibiotik dengan makrolida (Azitromisin).'
        });
      }
      if (systemInstruction.includes('Resepsionis')) {
        return 'Jam operasional Senin - Sabtu pukul 08:00 - 21:00 WIB. Melayani BPJS Kesehatan.';
      }
      if (systemInstruction.includes('Analis Data')) {
        return 'Ringkasan: Tren kunjungan pasien meningkat 12% minggu ini dengan 92% pelunasan.';
      }
      return 'OK';
    }
  };

  aiService.setClient(mockClient);

  // 1. Patient Smart Triage
  const triage = await aiService.triagePatient('Batuk sedikit sejak 2 hari');
  assert.strictEqual(triage.suggestedPoli, 'Poli Umum');
  assert.strictEqual(triage.isEmergency, false);
  assert.match(triage.triageLevel, /Ringan/);

  // 2. Patient Medication Explainer
  const explainer = await aiService.explainMedications([{ name: 'Amoxicillin 500mg' }], 'Faringitis');
  assert.match(explainer, /Antibiotik/);
  assert.match(explainer, /sebelum makan/);

  // 3. Doctor Ambient SOAP Generator
  const soap = await aiService.generateSoapFromNotes('demam 3 hr, faring merah', { temp: 38.5 });
  assert.strictEqual(soap.assessment, 'Faringitis Akut');
  assert.strictEqual(soap.icd10, 'J02.9');
  assert.match(soap.plan, /amoxicillin/i);

  // 4. Doctor Drug Safety Checker
  const safety = await aiService.checkPrescriptionSafety('Alergi Penisilin', ['Cefadroxil 500mg']);
  assert.strictEqual(safety.hasRisk, true);
  assert.strictEqual(safety.severity, 'SEDANG');
  assert.match(safety.recommendation, /Azitromisin/);

  // 5. Public / Patient Clinic FAQ
  const faq = await aiService.answerClinicFaq('Jam buka klinik?');
  assert.match(faq, /08:00 - 21:00/);

  // 6. Admin / Ops Natural Language Analytics
  const analytics = await aiService.queryClinicalAnalytics('Berapa kunjungan minggu ini?');
  assert.match(analytics, /12%/);
  assert.match(analytics, /92%/);
});

test('Gemini Payload Builder correctly formats options and instructions', () => {
  const payload = buildGeminiPayload('Cek data', 'System instruction test', { temperature: 0.1, maxOutputTokens: 1024 });
  assert.strictEqual(payload.contents[0].parts[0].text, 'Cek data');
  assert.strictEqual(payload.systemInstruction.parts[0].text, 'System instruction test');
  assert.strictEqual(payload.generationConfig.temperature, 0.1);
  assert.strictEqual(payload.generationConfig.maxOutputTokens, 1024);
});
