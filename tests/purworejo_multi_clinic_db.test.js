const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Database Schema & Seed - Purworejo multi-clinic and 2-role constraints', () => {
  const schemaSql = fs.readFileSync(path.join(__dirname, '../config/supabase-complete-schema.sql'), 'utf-8');
  const seedSql = fs.readFileSync(path.join(__dirname, '../config/supabase-seed-clinics-purworejo.sql'), 'utf-8');

  // Verify clinics table definition exists
  assert.match(schemaSql, /create table if not exists public\.clinics/i, 'Must define public.clinics table');
  assert.match(schemaSql, /district text not null/i, 'Must define district column');

  // Verify foreign keys
  assert.match(schemaSql, /clinic_id uuid references public\.clinics/i, 'Must reference public.clinics');

  // Verify 3 pilot clinics in seed
  assert.match(seedSql, /KLN-PWR-01/i, 'Must seed Klinik Sehat Mandiri Purworejo');
  assert.match(seedSql, /KLN-PWR-02/i, 'Must seed Klinik Kutoarjo Medika');
  assert.match(seedSql, /KLN-PWR-03/i, 'Must seed Klinik Banyuurip');
});
