const test = require('node:test');
const assert = require('node:assert');

test('gemini payload builder constructs valid Gemini 2.0 Flash REST request', () => {
  const { buildGeminiPayload } = require('../config/gemini.js');
  const payload = buildGeminiPayload('Halo dok', 'Kamu adalah asisten medis');
  assert.strictEqual(payload.contents[0].parts[0].text, 'Halo dok');
  assert.strictEqual(payload.systemInstruction.parts[0].text, 'Kamu adalah asisten medis');
});

test('api/gemini.js exports a valid Vercel Serverless request handler', () => {
  const handler = require('../api/gemini.js');
  assert.strictEqual(typeof handler, 'function');
});
