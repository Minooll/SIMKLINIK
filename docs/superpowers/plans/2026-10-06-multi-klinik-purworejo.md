# Platform Multi-Klinik Regional Kabupaten Purworejo (2-Role) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah SIMklinik menjadi Platform Multi-Klinik Regional di Kabupaten Purworejo dengan sistem 2-role (Pasien & Dokter), mengeliminasi role Petugas, menyediakan katalog & booking faskes per klinik, serta menyiapkan data layer untuk AI Recommender Chatbot.

**Architecture:** Menerapkan *Hybrid Modular Tenant Layer* dengan tabel master `clinics` dan kolom relasi `clinic_id`, modul service `clinicService.js`, katalog eksplorasi klinik dan modal booking terintegrasi di portal Pasien, penyaringan antrean di portal Dokter per klinik, serta eliminasi total terhadap role Petugas.

**Tech Stack:** Vanilla JavaScript (ES6+), Supabase / PostgreSQL RLS, HTML5/CSS3 Semantic, Node.js Native Test Runner (`node:test`).

**Spec:** [`docs/superpowers/specs/2026-10-06-multi-klinik-purworejo-design.md`](file:///d:/Code/AntiGravity/SIMklinik_Web/docs/superpowers/specs/2026-10-06-multi-klinik-purworejo-design.md)

## Global Constraints

- Wilayah studi kasus dibatasi pada Kabupaten Purworejo, Jawa Tengah (Kecamatan Purworejo Kota, Kutoarjo, dan Banyuurip).
- 3 Klinik Percontohan: `KLN-PWR-01` (Klinik Pratama Sehat Mandiri Purworejo), `KLN-PWR-02` (Klinik Pratama & Bersalin Kutoarjo Medika), `KLN-PWR-03` (Klinik Pratama Keluarga Banyuurip).
- Hanya 2 role yang beroperasi di sistem: `Pasien` dan `Dokter`. Role `Petugas` dihapus sepenuhnya.
- Backward compatibility: Data lama tanpa `clinic_id` otomatis fallback ke klinik default (`KLN-PWR-01`).
- Preservasi dokumentasi: Seluruh perubahan diverifikasi menggunakan `node --check` dan unit test suite.

## Review Focus

1. **Fallback Data Tanpa Clinic ID**: Panggilan data lama harus otomatis terhubung ke `KLN-PWR-01` tanpa melempar null reference error.
2. **Kesesuaian Dokter per Klinik**: Memilih klinik di modal booking harus menyaring dokter yang hanya terdaftar di klinik tersebut.
3. **Penyaringan Antrean Dokter**: Dokter klinik A tidak boleh memanggil antrean yang didaftarkan untuk klinik B.
4. **Eliminasi Total Role Petugas**: `login.html` dan `role-dashboard.js` tidak boleh lagi menyisakan jalur login atau runtime error terkait `petugas`.
5. **Kesiapan Konteks AI**: `window.getClinicsContextForAi()` harus menghasilkan array data valid dengan nama faskes, kecamatan, daftar poli, jam buka, dan beban antrean.

---

### Task 1: Database Migration & 3 Pilot Clinics Seed Data

**Files:**
- Create: `config/supabase-seed-clinics-purworejo.sql`
- Modify: `config/supabase-complete-schema.sql`
- Test: `tests/purworejo_multi_clinic_db.test.js`

**Interfaces:**
- Produces: Tabel `public.clinics`, foreign key `clinic_id` pada `doctors`, `services`, `doctor_schedules`, `appointments`, `queue_entries`, dan `profiles`. 3 data klinik percontohan Purworejo.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/purworejo_multi_clinic_db.test.js
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
  assert.match(schemaSql, /alter table public\.doctors add column if not exists clinic_id/i, 'doctors must have clinic_id');
  assert.match(schemaSql, /alter table public\.appointments add column if not exists clinic_id/i, 'appointments must have clinic_id');

  // Verify 3 pilot clinics in seed
  assert.match(seedSql, /KLN-PWR-01/i, 'Must seed Klinik Sehat Mandiri Purworejo');
  assert.match(seedSql, /KLN-PWR-02/i, 'Must seed Klinik Kutoarjo Medika');
  assert.match(seedSql, /KLN-PWR-03/i, 'Must seed Klinik Banyuurip');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/purworejo_multi_clinic_db.test.js`  
Expected: FAIL (seed file does not exist yet).

- [ ] **Step 3: Implement minimal schema and seed files**

Update `config/supabase-complete-schema.sql` with `clinics` table & `clinic_id` columns and create `config/supabase-seed-clinics-purworejo.sql`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/purworejo_multi_clinic_db.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/supabase-complete-schema.sql config/supabase-seed-clinics-purworejo.sql tests/purworejo_multi_clinic_db.test.js
git commit -m "feat(db): add Purworejo clinics schema and seed data"
```

---

### Task 2: Service Layer (`clinicService.js`) & AI Context Formatter

**Files:**
- Create: `assets/js/services/clinicService.js`
- Modify: `assets/js/services/appointmentService.js`
- Test: `tests/clinic_service.test.js`

**Interfaces:**
- Produces:
  - `window.clinicService.getClinics()` -> `Promise<Array<Clinic>>`
  - `window.clinicService.getClinicsByDistrict(district)` -> `Promise<Array<Clinic>>`
  - `window.clinicService.getClinicById(id)` -> `Promise<Clinic>`
  - `window.clinicService.getClinicQueueCount(clinicId)` -> `Promise<number>`
  - `window.getClinicsContextForAi()` -> `Promise<Array<{ id, name, district, services, operating_hours, active_queue_count }>>`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/clinic_service.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('clinicService - Provides 3 Purworejo clinics, district filtering, and AI context', async () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, '../assets/js/services/clinicService.js'), 'utf-8');
  assert.match(serviceCode, /getClinics\s*\(/, 'Must have getClinics method');
  assert.match(serviceCode, /getClinicsByDistrict\s*\(/, 'Must have getClinicsByDistrict method');
  assert.match(serviceCode, /getClinicsContextForAi\s*=/, 'Must expose getClinicsContextForAi helper');
  assert.match(serviceCode, /KLN-PWR-01/, 'Must include fallback mock clinic 1');
  assert.match(serviceCode, /KLN-PWR-02/, 'Must include fallback mock clinic 2');
  assert.match(serviceCode, /KLN-PWR-03/, 'Must include fallback mock clinic 3');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/clinic_service.test.js`  
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `clinicService.js` and update `appointmentService.js`**

Implement `assets/js/services/clinicService.js` and register to `window.clinicService`. In `appointmentService.js`, update `getAllDoctorsWithSchedules` to filter by `clinicId` when provided.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/clinic_service.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/services/clinicService.js assets/js/services/appointmentService.js tests/clinic_service.test.js
git commit -m "feat(services): implement clinicService and AI context generator for Purworejo"
```

---

### Task 3: Patient Portal - Katalog Faskes Purworejo & Booking Terpadu

**Files:**
- Modify: `pasien.html`
- Modify: `assets/css/role-pages.css`
- Modify: `assets/js/dashboard/role-dashboard.js`
- Test: `tests/patient_purworejo_catalog.test.js`

**Interfaces:**
- Consumes: `window.clinicService.getClinics()`, `window.clinicService.getClinicsByDistrict()`
- Produces:
  - Elemen `#clinicsExplorerSection` dan filter pills kecamatan (`#pillAllPurworejo`, `#pillKecPurworejo`, `#pillKecKutoarjo`, `#pillKecBanyuurip`).
  - Dropdown `#bookingClinicSelect` di modal `#modalBooking`.
  - Fungsi global `window.openBookingWithClinic(clinicId)` untuk membuka modal booking langsung dengan faskes terpilih.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/patient_purworejo_catalog.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Patient Portal - Purworejo clinic directory and booking integration', () => {
  const pasienHtml = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf-8');
  const roleJs = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'), 'utf-8');

  assert.match(pasienHtml, /id="clinicsExplorerSection"/, 'pasien.html must contain clinicsExplorerSection');
  assert.match(pasienHtml, /id="bookingClinicSelect"/, 'booking modal must have bookingClinicSelect dropdown');
  assert.match(pasienHtml, /assets\/js\/services\/clinicService\.js/, 'pasien.html must load clinicService.js');
  assert.match(roleJs, /function\s+renderClinicsExplorer/, 'role-dashboard.js must define renderClinicsExplorer');
  assert.match(roleJs, /window\.openBookingWithClinic/, 'role-dashboard.js must expose openBookingWithClinic');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/patient_purworejo_catalog.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement Patient UI and Dashboard Controller**

Update `pasien.html` (include `clinicService.js`, add clinics section and `#bookingClinicSelect`), update `assets/css/role-pages.css` with styling for clinic cards, and update `assets/js/dashboard/role-dashboard.js` with `renderClinicsExplorer()` and reactive doctor-clinic filtering.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/patient_purworejo_catalog.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pasien.html assets/css/role-pages.css assets/js/dashboard/role-dashboard.js tests/patient_purworejo_catalog.test.js
git commit -m "feat(patient): add Purworejo clinics directory and clinic-aware booking"
```

---

### Task 4: Doctor Portal - Afiliasi Klinik & Pemanggilan Antrean Langsung

**Files:**
- Modify: `dokter.html`
- Modify: `assets/js/dashboard/role-dashboard.js`
- Test: `tests/doctor_purworejo_clinic.test.js`

**Interfaces:**
- Consumes: `window.clinicService.getClinics()`, `clinic_id`
- Produces:
  - Header indicator & switcher klinik `#doctorClinicSelector` di `dokter.html`.
  - Fungsi `renderDokterDashboard()` yang memuat antrean tersaring berdasarkan klinik aktif.
  - Dokter memanggil dan melayani antrean secara mandiri tanpa memerlukan petugas.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/doctor_purworejo_clinic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Doctor Portal - Clinic affiliation header and direct queue calling', () => {
  const dokterHtml = fs.readFileSync(path.join(__dirname, '../dokter.html'), 'utf-8');
  const roleJs = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'), 'utf-8');

  assert.match(dokterHtml, /id="doctorClinicSelector"/, 'dokter.html must contain doctorClinicSelector switcher');
  assert.match(dokterHtml, /assets\/js\/services\/clinicService\.js/, 'dokter.html must include clinicService.js');
  assert.match(roleJs, /doctorActiveClinicId/, 'role-dashboard.js must track active clinic in doctor portal');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/doctor_purworejo_clinic.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement Doctor Portal Multi-Clinic affiliation**

Add clinic badge & switcher in `dokter.html`, connect `clinicService.js`, and update `initDokterPortal()` to filter appointments and queues by active clinic.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/doctor_purworejo_clinic.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add dokter.html assets/js/dashboard/role-dashboard.js tests/doctor_purworejo_clinic.test.js
git commit -m "feat(doctor): add clinic affiliation and direct queue management in doctor portal"
```

---

### Task 5: Eliminasi Role Petugas & Pembersihan Sistem

**Files:**
- Modify: `login.html`
- Modify: `assets/js/auth/login.js`
- Modify: `assets/js/dashboard/role-dashboard.js`
- Modify: `petugas.html` (redirect / deprecate gracefully)
- Test: `tests/petugas_role_elimination.test.js`

**Interfaces:**
- Produces: Sistem 2-role bersih (`Pasien` & `Dokter`). Login form hanya menampilkan role Pasien dan Dokter. `initPetugasPortal` dibersihkan. `petugas.html` dialihkan otomatis.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/petugas_role_elimination.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Role Elimination - Petugas role removed from login and redirected', () => {
  const loginHtml = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf-8');
  assert.doesNotMatch(loginHtml, /value="Petugas"/i, 'login.html must not contain Petugas role option');

  const petugasHtml = fs.readFileSync(path.join(__dirname, '../petugas.html'), 'utf-8');
  assert.match(petugasHtml, /window\.location\.replace\(['"]dokter\.html['"]\)/, 'petugas.html must safely redirect to dokter.html');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/petugas_role_elimination.test.js`  
Expected: FAIL.

- [ ] **Step 3: Remove Petugas role from login, auth, and dashboard**

Update `login.html` and `assets/js/auth/login.js` to support only Pasien and Dokter. Add redirect in `petugas.html` to `dokter.html`. Clean unused Petugas handler logic from `role-dashboard.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/petugas_role_elimination.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add login.html assets/js/auth/login.js assets/js/dashboard/role-dashboard.js petugas.html tests/petugas_role_elimination.test.js
git commit -m "refactor: eliminate Petugas role and streamline system to Pasien and Dokter"
```

---

### Task 6: Verifikasi End-to-End, AI Context Check, dan Task Reminder PRD

**Files:**
- Test: `tests/purworejo_e2e_multi_clinic.test.js`
- Modify: `README.md`

- [ ] **Step 1: Write End-to-End multi-clinic test**

Test clinic directory filtering, booking with clinic ID, AI context data format, and whole codebase syntax integrity.

- [ ] **Step 2: Run full test suite**

Run: `Get-ChildItem tests/*.test.js | ForEach-Object { node $_.FullName }`  
Expected: All tests PASS.

- [ ] **Step 3: Update documentation and set PRD Renewal Reminder**

Document the Purworejo Multi-Clinic architecture in `README.md`. Set a clear notice that the system is ready for the new PRD generation and legacy PRD removal.

- [ ] **Step 4: Commit**

```bash
git add tests/purworejo_e2e_multi_clinic.test.js README.md
git commit -m "test(e2e): verify Purworejo multi-clinic platform and update architecture docs"
```
