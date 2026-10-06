const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Client configurations provide valid Supabase and Gemini settings', () => {
  const supaPath = path.join(__dirname, '../config/supabase.js');
  const geminiPath = path.join(__dirname, '../config/gemini.js');

  assert.ok(fs.existsSync(supaPath), 'config/supabase.js must exist');
  assert.ok(fs.existsSync(geminiPath), 'config/gemini.js must exist');

  const supaContent = fs.readFileSync(supaPath, 'utf8');
  assert.match(supaContent, /supabaseUrl|SUPABASE_URL/i);
  assert.match(supaContent, /supabaseKey|SUPABASE_KEY/i);

  const geminiContent = fs.readFileSync(geminiPath, 'utf8');
  assert.match(geminiContent, /gemini-2\.0-flash/i);
  assert.match(geminiContent, /callGeminiApi/i);
});

test('Mock / Live fallback for Supabase and Gemini works gracefully', async () => {
  const { getSupabaseClient } = require('../config/supabase.js');
  const { callGeminiApi, GEMINI_CONFIG } = require('../config/gemini.js');

  const client = getSupabaseClient();
  assert.ok(client, 'Supabase client must be initialized');

  assert.strictEqual(GEMINI_CONFIG.model, 'gemini-2.0-flash');
  assert.ok(typeof callGeminiApi === 'function', 'callGeminiApi must be a function');
});
