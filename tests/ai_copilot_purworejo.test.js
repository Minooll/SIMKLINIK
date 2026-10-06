const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPurworejoSystemPrompt,
  parseAiActionTokens,
  askSasaAi
} = require('../assets/js/services/aiPurworejoService.js');
const { generateLocalFallbackResponse } = require('../config/gemini.js');

test('aiPurworejoService builds dynamic prompt injecting clinics, quotas, and queues', () => {
  const mockContext = {
    clinics: [
      { name: 'Klinik Pratama Sehat Mandiri', district: 'Purworejo Kota' }
    ],
    doctors: [
      { name: 'dr. Budi Santoso', clinic_name: 'Klinik Pratama Sehat Mandiri', remaining_quota: 5, active_queue_count: 2 }
    ]
  };

  const prompt = buildPurworejoSystemPrompt(mockContext);
  assert.match(prompt, /Sasa/i, 'Must introduce persona Sasa');
  assert.match(prompt, /Sahabat Asisten Sehat Anda/i, 'Must contain full acronym meaning');
  assert.match(prompt, /Purworejo/i, 'Must contain regional Purworejo context');
  assert.match(prompt, /Klinik Pratama Sehat Mandiri/i, 'Must inject clinic data');
  assert.match(prompt, /dr\. Budi Santoso/i, 'Must inject doctor data');
  assert.match(prompt, /sisa kuota: 5/i, 'Must include quota details');

  // Verify bounded training instructions
  assert.match(prompt, /KLINIS & KESEHATAN/i, 'Must train clinical health boundaries');
  assert.match(prompt, /SISTEM SIMKLINIK PURWOREJO/i, 'Must train SIMKLINIK system boundaries');
  assert.match(prompt, /DI LUAR TOPIK/i, 'Must instruct handling of out-of-topic questions');
  assert.match(prompt, /GIRING PERCAKAPAN KEMBALI/i, 'Must instruct redirecting back to clinical/SIMKLINIK topics');
});

test('parseAiActionTokens detects booking action and converts to interactive token', () => {
  const aiMessage = 'Silakan periksa ke dr. Budi di Klinik Sehat. [ACTION:BOOK, CLINIC_ID: "c1", DOCTOR_ID: "d1"]';
  const parsed = parseAiActionTokens(aiMessage);
  assert.strictEqual(parsed.hasAction, true);
  assert.strictEqual(parsed.clinicId, 'c1');
  assert.strictEqual(parsed.doctorId, 'd1');
  assert.match(parsed.cleanText, /Silakan periksa ke dr\. Budi/);
});

test('askSasaAi & fallback engine responds precisely to clinical, system, and redirects out-of-topic questions', async () => {
  // 1. Clinical query
  const clinicalRes = await askSasaAi('Anak saya demam tinggi di area Kutoarjo');
  assert.strictEqual(clinicalRes.hasAction, true);
  assert.match(clinicalRes.cleanText, /Hendra Wijaya|Kutoarjo|demam/i);

  // 2. System query: 12-hour rule
  const systemRuleRes = await askSasaAi('Bagaimana aturan pembatalan janji temu?');
  assert.match(systemRuleRes.cleanText, /12 jam/i);

  // 3. System query: countdown antrean live
  const systemCountdownRes = await askSasaAi('Apakah ada fitur countdown di antrean live?');
  assert.match(systemCountdownRes.cleanText, /countdown/i);

  // 4. Out-of-topic query: e.g. resep masakan / coding
  const outOfTopicRes = await askSasaAi('Bagaimana resep membuat rendang yang enak?');
  // Must give short answer AND steer back to health/SIMKLINIK
  assert.match(outOfTopicRes.cleanText, /makanan|resep|bergizi/i);
  assert.match(outOfTopicRes.cleanText, /kesehatan|SIMKLINIK|Purworejo/i);

  // 5. General fallback generator test
  const codingRes = generateLocalFallbackResponse('Bagaimana cara belajar coding python?');
  assert.match(codingRes, /teknologi|komputasi|SIMKLINIK/i);
  assert.match(codingRes, /kesehatan|Purworejo/i);
});
