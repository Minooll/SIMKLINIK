const test = require('node:test');
const assert = require('node:assert');

// Mock gemini client
const mockGeminiClient = {
  calls: [],
  responseToReturn: '',
  async callGemini(prompt, systemInstruction, options) {
    this.calls.push({ prompt, systemInstruction, options });
    return this.responseToReturn;
  }
};

const aiService = require('../assets/js/services/aiService.js');
aiService.setClient(mockGeminiClient);

test('triagePatient parses emergency and mild cases correctly', async () => {
  mockGeminiClient.responseToReturn = `ANALISIS: Nyeri dada khas infark.\nTINGKAT: DARURAT UGD\nSARAN: Segera ke IGD terdekat atau panggil 119.\n[EMERGENCY_ALERT]`;
  const result = await aiService.triagePatient('Nyeri dada tembus ke punggung', [], []);
  assert.strictEqual(result.isEmergency, true);
  assert.match(result.triageLevel, /UGD|DARURAT/i);
});

test('generateSoapFromNotes extracts JSON cleanly from markdown fences', async () => {
  mockGeminiClient.responseToReturn = '```json\n{\n  "subjective": "Batuk 3 hari",\n  "objective": "TD 120/80",\n  "assessment": "ISPA",\n  "icd10": "J06.9",\n  "plan": "Paracetamol 3x500mg"\n}\n```';
  const soap = await aiService.generateSoapFromNotes('batuk 3 hr', { systolic: 120, diastolic: 80 });
  assert.strictEqual(soap.assessment, 'ISPA');
  assert.strictEqual(soap.icd10, 'J06.9');
});

test('checkPrescriptionSafety identifies allergy conflict', async () => {
  mockGeminiClient.responseToReturn = '```json\n{\n  "hasRisk": true,\n  "severity": "TINGGI",\n  "warning": "Pasien alergi Penisilin. Amoxicillin termasuk golongan Penisilin.",\n  "recommendation": "Ganti dengan Eritromisin atau Azitromisin."\n}\n```';
  const safety = await aiService.checkPrescriptionSafety('Alergi Amoxicillin', ['Amoxicillin 500mg']);
  assert.strictEqual(safety.hasRisk, true);
  assert.strictEqual(safety.severity, 'TINGGI');
});
