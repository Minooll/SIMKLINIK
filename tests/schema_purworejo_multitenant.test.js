const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Multi-Tenant PostgreSQL schema matches ARCHITECTURE.md specifications', () => {
  const schemaPath = path.join(__dirname, '../config/schema-purworejo-multitenant.sql');
  assert.ok(fs.existsSync(schemaPath), 'schema-purworejo-multitenant.sql must exist');

  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Verify tables
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.clinics/i);
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.clinic_owners/i);
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.doctors/i);
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.doctor_schedules/i);
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.patients/i);
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.appointments/i);
  assert.match(sql, /CREATE TABLE (IF NOT EXISTS )?public\.medical_records/i);

  // Verify functions
  assert.match(sql, /CREATE OR REPLACE FUNCTION generate_clinic_referral_code/i);
  assert.match(sql, /CREATE OR REPLACE FUNCTION bind_doctor_with_code/i);
  assert.match(sql, /CREATE OR REPLACE FUNCTION cancel_appointment/i);
  assert.match(sql, /CREATE OR REPLACE FUNCTION finalize_rme_and_advance_queue/i);

  // Verify 12-hour rule logic in SQL
  assert.match(sql, /interval '12 hours'/i);

  // Verify Purworejo seed clinics
  assert.match(sql, /Klinik Pratama Sehat Mandiri Purworejo/i);
  assert.match(sql, /Klinik Pratama & Bersalin Kutoarjo Medika/i);
  assert.match(sql, /Klinik Pratama Keluarga Banyuurip/i);
});
