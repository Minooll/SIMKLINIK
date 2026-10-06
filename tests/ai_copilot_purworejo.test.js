const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPurworejoSystemPrompt,
  parseAiActionTokens
} = require('../assets/js/services/aiPurworejoService.js');

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
  assert.match(prompt, /Nayla/i, 'Must introduce persona Nayla');
  assert.match(prompt, /Purworejo/i, 'Must contain regional Purworejo context');
  assert.match(prompt, /Klinik Pratama Sehat Mandiri/i, 'Must inject clinic data');
  assert.match(prompt, /dr\. Budi Santoso/i, 'Must inject doctor data');
  assert.match(prompt, /sisa kuota: 5/i, 'Must include quota details');
});

test('parseAiActionTokens detects booking action and converts to interactive token', () => {
  const aiMessage = 'Silakan periksa ke dr. Budi di Klinik Sehat. [ACTION:BOOK, CLINIC_ID: "c1", DOCTOR_ID: "d1"]';
  const parsed = parseAiActionTokens(aiMessage);
  assert.strictEqual(parsed.hasAction, true);
  assert.strictEqual(parsed.clinicId, 'c1');
  assert.strictEqual(parsed.doctorId, 'd1');
  assert.match(parsed.cleanText, /Silakan periksa ke dr\. Budi/);
});
