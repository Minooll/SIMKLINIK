# SIMKLINIK Purworejo Multi-Tenant Architecture Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghapus seluruh struktur berkas legacy (kecuali dokumentasi dan git) dan membangun ulang SIMKLINIK Purworejo dari awal sebagai platform agregator multi-tenant faskes regional (3 peran: Pemilik Klinik, Dokter, Pasien) dengan basis data Supabase PostgreSQL 15, otentikasi Google OAuth + kode unik kriptografis anti-salah masuk, RME SOAP sekuensial otomatis, proteksi pembatalan 12 jam, onboarding profil wajib (KK/NIK), dan AI Copilot Gemini 2.0 Flash dengan live context injection.

**Architecture:** Arsitektur web modular murni (ES6+ Zero-bundler) yang dipetakan langsung ke Supabase Cloud (PostgreSQL RLS & WebSockets Realtime) dan Google Gemini 2.0 Flash REST API. Terdiri dari 5 halaman inti (`index.html`, `login.html`, `pemilik.html`, `dokter.html`, `pasien.html`), 5 layanan modular (`clinicService`, `appointmentService`, `queueService`, `rmeService`, `aiPurworejoService`), komponen UI dialog aksesibel, dan skema basis data multi-tenant dengan isolasi relasi tenant (`clinic_id`).

**Tech Stack:** Vanilla JavaScript (ES6+ Modules), HTML5 Semantic, Modern CSS Design System (Custom Properties, Flexbox/Grid, Glassmorphism, Micro-animations), Supabase JS Client v2 / PostgreSQL 15, Google Gemini 2.0 Flash API, Node.js Native Test Runner (`node:test`).

**Spec:** [`docs/superpowers/specs/2026-10-06-simklinik-purworejo-multitenant-design.md`](file:///d:/Code/AntiGravity/SIMklinik_Web/docs/superpowers/specs/2026-10-06-simklinik-purworejo-multitenant-design.md), [`docs/ARCHITECTURE.md`](file:///d:/Code/AntiGravity/SIMklinik_Web/docs/ARCHITECTURE.md), dan [`docs/PRD.md`](file:///d:/Code/AntiGravity/SIMklinik_Web/docs/PRD.md).

## Global Constraints

- Wilayah fokus sistem dibatasi pada Kabupaten Purworejo, Jawa Tengah (Purworejo Kota, Kutoarjo, Banyuurip, Bayan, dsb).
- Zero external build tools (tanpa Webpack/Vite/Babel) agar dapat dijalankan secara instan melalui static file server lokal atau browser langsung.
- Tiga peran utama pengguna: `pemilik` (Tenant Admin), `dokter` (Practitioner), dan `pasien` (Masyarakat). Role lama `petugas` sepenuhnya ditiadakan.
- Dokter wajib diverifikasi menggunakan kode unik klinik berformat `PWR-[PREFIX]-[6_ALPHANUMERIC]` dengan proteksi brute-force (kunci 15 menit jika 3 kali salah).
- Pembatalan janji temu terkunci mati (disabled/abu-abu) jika sisa waktu menuju jadwal pemeriksaan kurang dari 12 jam ($\Delta t < 12$ jam).
- Penyelesaian RME SOAP oleh dokter secara atomik memajukan nomor antrean dan memuat form pasien berikutnya tanpa reload manual.
- Pasien wajib mengisi data diri (No. KK 16 digit, NIK 16 digit, Golongan Darah, Alergi, No. HP) sebelum janji pertama diproses.
- Chatbot AI ditenagai Gemini 2.0 Flash dengan injeksi konteks live kuota dokter, antrean, dan fasilitas klinik di Purworejo.
- Preservasi berkas: Folder `docs/`, `.git/`, dan `.gitignore` tidak boleh terhapus.

## Review Focus

1. **Proteksi Strict Binding Dokter**: Dokter yang memasukkan kode klinik A tidak boleh dapat melihat atau memproses pasien klinik B.
2. **Kunci Pembatalan 12 Jam**: Janji dengan selisih waktu $< 12$ jam wajib menampilkan tombol disabled abu-abu dan menolak eksekusi pembatalan.
3. **Otomasi Sekuensial Selesai RME**: Menekan "Selesai & Simpan RME" harus memajukan status janji aktif ke `selesai`, memajukan janji berikutnya ke `sedang_diperiksa`, dan mengosongkan/memuat data pasien baru secara instan.
4. **Validasi Wajib Data Pasien**: Pasien baru tanpa No. KK / NIK / Alergi tidak boleh dapat melakukan submit pemesanan janji temu sebelum modal onboarding dilengkapi.
5. **Kesiapan Konteks AI Purworejo**: `aiPurworejoService.buildSystemPrompt()` harus menginjeksi daftar klinik Purworejo, sisa kuota dokter hari ini, dan beban keramaian antrean secara akurat.

---

### Task 1: Clean Slate & Directory Structure Initialization

**Files:**
- Create: `tests/clean_slate_structure.test.js`
- Test: `tests/clean_slate_structure.test.js`

**Interfaces:**
- Produces: Direktori bersih sesuai Bagian 2 `docs/ARCHITECTURE.md` (`assets/css/`, `assets/js/auth/`, `assets/js/components/`, `assets/js/services/`, `config/`, `docs/`, `tests/`), menghapus kode usang di root (`api/`, `scratch/`, file JS usang di `assets/js/`), serta menjaga integritas folder `docs/` dan `.git/`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/clean_slate_structure.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Project Structure conforms to ARCHITECTURE.md Section 2', () => {
  const baseDir = path.join(__dirname, '..');

  // Verify necessary clean directory structure exists
  const requiredDirs = [
    'assets/css',
    'assets/js/auth',
    'assets/js/components',
    'assets/js/services',
    'config',
    'docs',
    'tests'
  ];

  for (const dir of requiredDirs) {
    assert.ok(fs.existsSync(path.join(baseDir, dir)), `Directory must exist: ${dir}`);
  }

  // Verify obsolete directories are removed
  assert.ok(!fs.existsSync(path.join(baseDir, 'api')), 'Legacy api directory should be removed');
  assert.ok(!fs.existsSync(path.join(baseDir, 'scratch')), 'Legacy scratch directory should be removed');
  assert.ok(!fs.existsSync(path.join(baseDir, 'assets/js/dashboard')), 'Legacy dashboard directory should be removed');

  // Verify docs integrity preserved
  assert.ok(fs.existsSync(path.join(baseDir, 'docs/PRD.md')), 'docs/PRD.md must be preserved');
  assert.ok(fs.existsSync(path.join(baseDir, 'docs/ARCHITECTURE.md')), 'docs/ARCHITECTURE.md must be preserved');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/clean_slate_structure.test.js`  
Expected: FAIL (legacy directories `api/` or `scratch/` still exist).

- [ ] **Step 3: Clean legacy files and initialize directory structure**

Execute clean-up via safe removal commands (removing legacy root files and directories while strictly preserving `docs/`, `.git/`, `.gitignore`), and ensure directories `assets/css`, `assets/js/auth`, `assets/js/components`, `assets/js/services`, `config`, and `tests` exist.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/clean_slate_structure.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean legacy structure and initialize architecture directories"
```

---

### Task 2: PostgreSQL Multi-Tenant Database Schema & Purworejo Seed Data

**Files:**
- Create: `config/schema-purworejo-multitenant.sql`
- Test: `tests/schema_purworejo_multitenant.test.js`

**Interfaces:**
- Produces: Skrip DDL PostgreSQL 15 lengkap yang mendefinisikan tabel `clinics`, `clinic_owners`, `doctors`, `doctor_schedules`, `patients`, `appointments`, `medical_records`, fungsi kriptografis `generate_clinic_referral_code`, `bind_doctor_with_code`, `cancel_appointment`, `finalize_rme_and_advance_queue`, serta seed data 3 klinik Purworejo dan dokter percontohan.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/schema_purworejo_multitenant.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/schema_purworejo_multitenant.test.js`  
Expected: FAIL (`config/schema-purworejo-multitenant.sql` does not exist).

- [ ] **Step 3: Implement `config/schema-purworejo-multitenant.sql`**

Write the complete PostgreSQL 15 schema as specified in Sections 3, 4, and 5 of `docs/ARCHITECTURE.md`, including table definitions with RLS policies, cryptographically secure functions, and seed data for Purworejo clinics and doctors.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/schema_purworejo_multitenant.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/schema-purworejo-multitenant.sql tests/schema_purworejo_multitenant.test.js
git commit -m "feat(db): implement complete multi-tenant Purworejo PostgreSQL schema and seeds"
```

---

### Task 3: Client Configurations (`supabase.js` & `gemini.js`)

**Files:**
- Create: `config/supabase.js`
- Create: `config/gemini.js`
- Test: `tests/config_clients.test.js`

**Interfaces:**
- Produces: Inisialisasi klien Supabase (`supabaseClient`) dengan fallback mock in-memory terisolasi untuk pengujian offline, dan konfigurasi klien Gemini (`geminiConfig`, model `gemini-2.0-flash`, helper `callGeminiApi`).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/config_clients.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/config_clients.test.js`  
Expected: FAIL (`config/supabase.js` or `config/gemini.js` missing).

- [ ] **Step 3: Implement `config/supabase.js` and `config/gemini.js`**

Implement `config/supabase.js` with client initialization and browser/Node environment detection. Implement `config/gemini.js` pointing to Gemini 2.0 Flash endpoint with fallback handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/config_clients.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/supabase.js config/gemini.js tests/config_clients.test.js
git commit -m "feat(config): implement supabase and gemini client modules"
```

---

### Task 4: Base UI Design System & Common Components (`modal.js`, `toast.js`)

**Files:**
- Create: `assets/css/dashboard.css`
- Create: `assets/css/modal.css`
- Create: `assets/css/role-pages.css`
- Create: `assets/js/components/modal.js`
- Create: `assets/js/components/toast.js`
- Test: `tests/ui_components.test.js`

**Interfaces:**
- Produces: CSS layout dashboard bersama, dialog modal aksesibel (dengan fokus trap & ESC handler), serta notification toast mengambang (success, error, warning).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ui_components.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('UI Components and Design System stylesheets exist and define required elements', () => {
  const modalCss = fs.readFileSync(path.join(__dirname, '../assets/css/modal.css'), 'utf8');
  const dashCss = fs.readFileSync(path.join(__dirname, '../assets/css/dashboard.css'), 'utf8');
  const roleCss = fs.readFileSync(path.join(__dirname, '../assets/css/role-pages.css'), 'utf8');
  const modalJs = fs.readFileSync(path.join(__dirname, '../assets/js/components/modal.js'), 'utf8');
  const toastJs = fs.readFileSync(path.join(__dirname, '../assets/js/components/toast.js'), 'utf8');

  assert.match(dashCss, /--primary/i, 'dashboard.css must define color tokens');
  assert.match(modalCss, /\.modal-backdrop|\.modal-container/i, 'modal.css must style modals');
  assert.match(roleCss, /\.clinic-card|\.queue-badge/i, 'role-pages.css must style clinic cards & queues');
  assert.match(modalJs, /showModal|closeModal|initModal/i, 'modal.js must export modal helpers');
  assert.match(toastJs, /showToast/i, 'toast.js must export showToast helper');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui_components.test.js`  
Expected: FAIL (files do not exist yet).

- [ ] **Step 3: Implement CSS files and JS components**

Implement modern medical-tech styles (Teal/Slate color palette, glassmorphism, responsive navigation) and accessible JS modal/toast controllers.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui_components.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/css/ assets/js/components/ tests/ui_components.test.js
git commit -m "feat(ui): implement base design system CSS, modal, and toast components"
```

---

### Task 5: Multi-Role Authentication Module & Unique Code Binding (`login.html`)

**Files:**
- Create: `assets/js/auth/multiRoleAuth.js`
- Create: `assets/css/auth.css`
- Create: `login.html`
- Test: `tests/multi_role_auth.test.js`

**Interfaces:**
- Produces: Tab switcher 3 peran (Pasien, Dokter, Pemilik Klinik), penanganan Google OAuth, validasi kode unik klinik bagi dokter (`PWR-[PREFIX]-[CODE]`), anti-brute-force rate limiting (kunci 15 menit jika 3x gagal), dan pengalihan ke dashboard masing-masing.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/multi_role_auth.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validateReferralCodeFormat, checkRateLimit, recordFailedAttempt, resetAttempts } = require('../assets/js/auth/multiRoleAuth.js');

test('multiRoleAuth - Referral code validation and brute force rate limiting', () => {
  // Test code format: PWR-[PREFIX]-[6 ALPHANUMERIC]
  assert.strictEqual(validateReferralCodeFormat('PWR-SEHAT-9X8K2M'), true);
  assert.strictEqual(validateReferralCodeFormat('PWR-MEDIKA-ABC123'), true);
  assert.strictEqual(validateReferralCodeFormat('INVALID-CODE'), false);
  assert.strictEqual(validateReferralCodeFormat('PWR-123'), false);

  // Rate limiting test
  const testId = 'test-doctor-rate-limit';
  resetAttempts(testId);
  assert.strictEqual(checkRateLimit(testId).isLocked, false);

  recordFailedAttempt(testId);
  recordFailedAttempt(testId);
  assert.strictEqual(checkRateLimit(testId).isLocked, false);

  recordFailedAttempt(testId); // 3rd failure locks it
  const lockedStatus = checkRateLimit(testId);
  assert.strictEqual(lockedStatus.isLocked, true);
  assert.ok(lockedStatus.remainingMinutes > 0);
});

test('login.html contains 3 role tabs and no legacy petugas references', () => {
  const html = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf8');
  assert.match(html, /data-role=["']pasien["']/i);
  assert.match(html, /data-role=["']dokter["']/i);
  assert.match(html, /data-role=["']pemilik["']/i);
  assert.doesNotMatch(html, /data-role=["']petugas["']/i);
  assert.match(html, /id=["']referral-code-input["']/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/multi_role_auth.test.js`  
Expected: FAIL (`multiRoleAuth.js` or `login.html` missing).

- [ ] **Step 3: Implement `assets/js/auth/multiRoleAuth.js`, `assets/css/auth.css`, and `login.html`**

Build the auth controller with cryptographic validation and the 3-tab modern login interface.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/multi_role_auth.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/auth/multiRoleAuth.js assets/css/auth.css login.html tests/multi_role_auth.test.js
git commit -m "feat(auth): implement 3-role authentication and strict referral code binding"
```

---

### Task 6: Clinic & Doctor Service (`clinicService.js`) and Owner Dashboard (`pemilik.html`)

**Files:**
- Create: `assets/js/services/clinicService.js`
- Create: `pemilik.html`
- Test: `tests/clinic_service_and_owner.test.js`

**Interfaces:**
- Produces: Service pengelola klinik Purworejo, filter kecamatan (Purworejo Kota, Kutoarjo, Banyuurip, Bayan, dsb), generator kode referral kriptografis klinik, CRUD data dokter & kuota harian oleh pemilik klinik, dan dashboard `pemilik.html`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/clinic_service_and_owner.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  getClinics,
  getClinicsByDistrict,
  generateReferralCode,
  createDoctor,
  getDoctorsByClinic
} = require('../assets/js/services/clinicService.js');

test('clinicService provides clinic list, district filtering, and doctor management', async () => {
  const allClinics = await getClinics();
  assert.ok(Array.isArray(allClinics));
  assert.ok(allClinics.length >= 3, 'Must have at least 3 Purworejo pilot clinics');

  const kutoarjoClinics = await getClinicsByDistrict('Kutoarjo');
  assert.ok(kutoarjoClinics.every(c => c.district.toLowerCase() === 'kutoarjo'));

  const newCode = generateReferralCode('SEHAT');
  assert.match(newCode, /^PWR-SEHAT-[A-Z0-9]{6}$/);

  const doc = await createDoctor({
    clinic_id: allClinics[0].id,
    full_name: 'dr. Test Sp.A',
    specialty: 'Anak',
    sip_number: 'SIP-TEST-001',
    daily_quota: 25
  });
  assert.strictEqual(doc.full_name, 'dr. Test Sp.A');

  const doctors = await getDoctorsByClinic(allClinics[0].id);
  assert.ok(doctors.some(d => d.sip_number === 'SIP-TEST-001'));
});

test('pemilik.html provides clinic profile and doctor management interface', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pemilik.html'), 'utf8');
  assert.match(html, /id=["']clinic-referral-code["']/i);
  assert.match(html, /id=["']btn-copy-code["']/i);
  assert.match(html, /id=["']doctor-form["']/i);
  assert.match(html, /id=["']doctor-quota-input["']/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/clinic_service_and_owner.test.js`  
Expected: FAIL (`clinicService.js` or `pemilik.html` missing).

- [ ] **Step 3: Implement `clinicService.js` and `pemilik.html`**

Implement complete clinic queries, Purworejo district filtering, doctor registry, code copy handlers, and the owner dashboard.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/clinic_service_and_owner.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/services/clinicService.js pemilik.html tests/clinic_service_and_owner.test.js
git commit -m "feat(owner): implement clinic service and clinic owner management portal"
```

---

### Task 7: Appointment & Queue Services with 12-Hour Cancellation Rule

**Files:**
- Create: `assets/js/services/appointmentService.js`
- Create: `assets/js/services/queueService.js`
- Test: `tests/appointment_and_queue.test.js`

**Interfaces:**
- Produces: Service reservasi kuota harian dokter, validasi sisa kuota, kalkulasi status `can_cancel` berbasis selisih 12 jam ($\Delta t \ge 12\text{ jam}$), pembatalan janji, dan manajemen live queue monitor.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/appointment_and_queue.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isCancellationAllowed,
  createAppointment,
  cancelAppointment,
  getDoctorQueueToday
} = require('../assets/js/services/appointmentService.js');

test('appointmentService enforces strict 12-hour cancellation rule', () => {
  const now = new Date();

  // Case 1: Appointment is 24 hours in future -> ALLOWED
  const futureDate = new Date(now.getTime() + 24 * 3600 * 1000);
  const dateStrFuture = futureDate.toISOString().split('T')[0];
  const timeStrFuture = '10:00:00';
  assert.strictEqual(isCancellationAllowed(dateStrFuture, timeStrFuture, now), true);

  // Case 2: Appointment is 6 hours in future -> BLOCKED (< 12 hours)
  const soonDate = new Date(now.getTime() + 6 * 3600 * 1000);
  const dateStrSoon = soonDate.toISOString().split('T')[0];
  const timeStrSoon = `${String(soonDate.getHours()).padStart(2, '0')}:${String(soonDate.getMinutes()).padStart(2, '0')}:00`;
  assert.strictEqual(isCancellationAllowed(dateStrSoon, timeStrSoon, now), false);

  // Case 3: Appointment is 11.5 hours in future -> BLOCKED
  const elevenHoursDate = new Date(now.getTime() + 11.5 * 3600 * 1000);
  const dateStrEleven = elevenHoursDate.toISOString().split('T')[0];
  const timeStrEleven = `${String(elevenHoursDate.getHours()).padStart(2, '0')}:${String(elevenHoursDate.getMinutes()).padStart(2, '0')}:00`;
  assert.strictEqual(isCancellationAllowed(dateStrEleven, timeStrEleven, now), false);
});

test('cancelAppointment rejects appointments within 12 hours', async () => {
  const now = new Date();
  const soonDate = new Date(now.getTime() + 4 * 3600 * 1000);
  const appt = {
    id: 'appt-test-12hr',
    appointment_date: soonDate.toISOString().split('T')[0],
    appointment_time: '14:00:00',
    status: 'menunggu'
  };

  const result = await cancelAppointment(appt, now);
  assert.strictEqual(result.success, false);
  assert.match(result.message, /12 jam/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/appointment_and_queue.test.js`  
Expected: FAIL (`appointmentService.js` missing).

- [ ] **Step 3: Implement `appointmentService.js` and `queueService.js`**

Implement booking logic with quota enforcement, timestamp differential calculations for the 12-hour lock, and queue management functions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/appointment_and_queue.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/services/appointmentService.js assets/js/services/queueService.js tests/appointment_and_queue.test.js
git commit -m "feat(appointments): implement appointment service with strict 12-hour cancellation rule"
```

---

### Task 8: Electronic Medical Records (RME SOAP) Service & Sequential Doctor Flow (`dokter.html`)

**Files:**
- Create: `assets/js/services/rmeService.js`
- Create: `dokter.html`
- Test: `tests/rme_and_doctor_flow.test.js`

**Interfaces:**
- Produces: Service pencatatan RME SOAP (Subjective, Objective, Assessment, Plan, Resep), prosedur atomik `finalizeRmeAndAdvanceQueue`, dan dashboard `dokter.html` dengan otomasi pengaktifan RME antrean pertama dan pergeseran sekuensial instan.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/rme_and_doctor_flow.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { finalizeRmeAndAdvanceQueue, getPatientMedicalRecords } = require('../assets/js/services/rmeService.js');

test('rmeService atomics: finalizes current appointment, advances queue, loads next patient', async () => {
  const queueData = [
    { id: 'appt-1', patient_id: 'pat-1', queue_order: 1, status: 'sedang_diperiksa' },
    { id: 'appt-2', patient_id: 'pat-2', queue_order: 2, status: 'menunggu' }
  ];

  const soapPayload = {
    appointment_id: 'appt-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    clinic_id: 'clinic-1',
    soap_subjective: 'Demam 3 hari',
    soap_objective: 'TD 120/80, Suhu 38.5C',
    soap_assessment: 'Febris Akut ec Viral Infection (A09)',
    soap_plan: 'Paracetamol 500mg 3x1',
    prescription_notes: 'Banyak minum air putih'
  };

  const result = await finalizeRmeAndAdvanceQueue(soapPayload, queueData);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.has_next, true);
  assert.strictEqual(result.next_appointment_id, 'appt-2');
  assert.strictEqual(queueData[0].status, 'selesai');
  assert.strictEqual(queueData[1].status, 'sedang_diperiksa');
});

test('dokter.html contains SOAP form elements, finish button, and live queue display', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dokter.html'), 'utf8');
  assert.match(html, /id=["']soap-subjective["']/i);
  assert.match(html, /id=["']soap-objective["']/i);
  assert.match(html, /id=["']soap-assessment["']/i);
  assert.match(html, /id=["']soap-plan["']/i);
  assert.match(html, /id=["']btn-finalize-rme["']/i);
  assert.match(html, /id=["']today-queue-list["']/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rme_and_doctor_flow.test.js`  
Expected: FAIL (`rmeService.js` or `dokter.html` missing).

- [ ] **Step 3: Implement `rmeService.js` and `dokter.html`**

Implement SOAP storage, sequential transition logic, and the doctor workspace in `dokter.html`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rme_and_doctor_flow.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/services/rmeService.js dokter.html tests/rme_and_doctor_flow.test.js
git commit -m "feat(doctor): implement SOAP RME service and doctor sequential queue dashboard"
```

---

### Task 9: Patient Onboarding, Booking, Queue Tracking & Medical History (`pasien.html`)

**Files:**
- Create: `pasien.html`
- Test: `tests/patient_portal.test.js`

**Interfaces:**
- Produces: Portal pasien lengkap dengan modal wajib kelengkapan profil (No. KK 16 digit, NIK 16 digit, Golongan Darah, Alergi, Kontak Darurat), eksplorasi klinik Purworejo dengan indikator sisa kuota & beban antrean, pemesanan tiket antrean, tombol pembatalan dengan kunci 12 jam, tiket live antrean, dan riwayat RME.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/patient_portal.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('pasien.html has mandatory profile onboarding modal, clinic explorer, and queue ticket', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf8');

  // Mandatory profile onboarding elements
  assert.match(html, /id=["']modal-profile-onboarding["']/i);
  assert.match(html, /id=["']input-no-kk["']/i);
  assert.match(html, /id=["']input-nik["']/i);
  assert.match(html, /id=["']input-blood-type["']/i);
  assert.match(html, /id=["']input-allergies["']/i);

  // Purworejo clinic catalogue & district filter
  assert.match(html, /id=["']district-filter["']/i);
  assert.match(html, /id=["']clinic-grid["']/i);

  // 12-hour warning in booking modal
  assert.match(html, /12 jam/i);

  // Live queue & medical record tabs
  assert.match(html, /id=["']live-ticket-card["']/i);
  assert.match(html, /id=["']rme-history-list["']/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/patient_portal.test.js`  
Expected: FAIL (`pasien.html` missing).

- [ ] **Step 3: Implement `pasien.html`**

Build the patient portal adhering to Section 3.3 in `docs/ARCHITECTURE.md` and `docs/PRD.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/patient_portal.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pasien.html tests/patient_portal.test.js
git commit -m "feat(patient): implement patient portal with mandatory onboarding, booking, and RME history"
```

---

### Task 10: Gemini 2.0 Flash AI Copilot & Floating Chatbot Widget

**Files:**
- Create: `assets/js/services/aiPurworejoService.js`
- Create: `assets/js/components/aiChatWidget.js`
- Create: `assets/css/ai-chat.css`
- Test: `tests/ai_copilot_purworejo.test.js`

**Interfaces:**
- Produces: Service AI Gemini 2.0 Flash dengan persona "Nayla - Asisten Medis Virtual SIMKLINIK Purworejo", injeksi konteks live kuota dokter, antrean per klinik, dan pembuat tombol aksi `[📅 Buat Janji di Klinik Ini]` di widget chat mengambang.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ai_copilot_purworejo.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai_copilot_purworejo.test.js`  
Expected: FAIL (`aiPurworejoService.js` missing).

- [ ] **Step 3: Implement `aiPurworejoService.js`, `aiChatWidget.js`, and `assets/css/ai-chat.css`**

Implement Gemini 2.0 Flash integration, prompt injection, and chat widget UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ai_copilot_purworejo.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/services/aiPurworejoService.js assets/js/components/aiChatWidget.js assets/css/ai-chat.css tests/ai_copilot_purworejo.test.js
git commit -m "feat(ai): implement Gemini 2.0 Flash Purworejo copilot and floating chat widget"
```

---

### Task 11: Public Landing Page & Purworejo Clinic Catalogue Explorer (`index.html`)

**Files:**
- Create: `index.html`
- Test: `tests/landing_page.test.js`

**Interfaces:**
- Produces: Halaman depan publik (`index.html`) dengan showcase klinik se-Kabupaten Purworejo, filter kecamatan, status antrean live, tombol login/register 3 peran, dan floating AI Chatbot.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/landing_page.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('index.html provides public Purworejo clinic catalogue and AI widget mount point', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Title and branding
  assert.match(html, /SIMKLINIK Purworejo/i);

  // Explorer components
  assert.match(html, /id=["']public-clinic-explorer["']/i);
  assert.match(html, /id=["']district-filter-public["']/i);

  // Link to login
  assert.match(html, /href=["']login\.html["']/i);

  // AI Widget integration
  assert.match(html, /aiChatWidget\.js/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/landing_page.test.js`  
Expected: FAIL (`index.html` missing).

- [ ] **Step 3: Implement `index.html`**

Create modern, high-aesthetic responsive landing page showcasing Purworejo clinics and embedding the chatbot widget.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/landing_page.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/landing_page.test.js
git commit -m "feat(landing): implement public landing page and clinic catalogue explorer"
```

---

### Task 12: End-to-End System Integration & Multi-Tenant Regression Test Suite

**Files:**
- Create: `tests/e2e_purworejo_multitenant.test.js`
- Test: `tests/e2e_purworejo_multitenant.test.js`

**Interfaces:**
- Consumes: Seluruh modul service, auth, RME, dan UI.
- Produces: Verifikasi menyeluruh alur 3 peran, isolasi tenant klinik Purworejo, pembatalan 12 jam, otomasi sekuensial RME, dan validasi sintaks seluruh file ES6 (`node --check`).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/e2e_purworejo_multitenant.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const path = require('path');

test('E2E: All JavaScript files pass Node syntax check', () => {
  const files = [
    'config/supabase.js',
    'config/gemini.js',
    'assets/js/auth/multiRoleAuth.js',
    'assets/js/components/modal.js',
    'assets/js/components/toast.js',
    'assets/js/components/aiChatWidget.js',
    'assets/js/services/clinicService.js',
    'assets/js/services/appointmentService.js',
    'assets/js/services/queueService.js',
    'assets/js/services/rmeService.js',
    'assets/js/services/aiPurworejoService.js'
  ];

  for (const file of files) {
    const fullPath = path.join(__dirname, '..', file);
    assert.doesNotThrow(() => {
      execSync(`node --check "${fullPath}"`);
    }, `File ${file} must have valid JavaScript syntax`);
  }
});

test('E2E: Full User Journey - Owner creates clinic, Doctor binds, Patient books with 12hr rule, Doctor saves RME sequentially', async () => {
  const { getClinics, createDoctor } = require('../assets/js/services/clinicService.js');
  const { validateReferralCodeFormat } = require('../assets/js/auth/multiRoleAuth.js');
  const { createAppointment, cancelAppointment } = require('../assets/js/services/appointmentService.js');
  const { finalizeRmeAndAdvanceQueue } = require('../assets/js/services/rmeService.js');

  // 1. Clinics available
  const clinics = await getClinics();
  assert.ok(clinics.length >= 3);
  const clinic = clinics[0];

  // 2. Doctor code format valid
  assert.strictEqual(validateReferralCodeFormat(clinic.referral_code), true);

  // 3. Patient books appointment
  const now = new Date();
  const appointment = await createAppointment({
    clinic_id: clinic.id,
    doctor_id: 'doc-purworejo-1',
    patient_id: 'pat-purworejo-1',
    appointment_date: new Date(now.getTime() + 2 * 3600 * 1000).toISOString().split('T')[0], // 2 hours away
    appointment_time: '18:00:00'
  });
  assert.ok(appointment.queue_number);

  // 4. Cancellation within 12 hours is rejected
  const cancelResult = await cancelAppointment(appointment, now);
  assert.strictEqual(cancelResult.success, false);

  // 5. Doctor advances RME sequentially
  const rmeResult = await finalizeRmeAndAdvanceQueue({
    appointment_id: appointment.id,
    patient_id: 'pat-purworejo-1',
    doctor_id: 'doc-purworejo-1',
    clinic_id: clinic.id,
    soap_subjective: 'Keluhan batuk pilek',
    soap_objective: 'Suhu 37.2',
    soap_assessment: 'ISPA',
    soap_plan: 'Ambroxol tab',
    prescription_notes: 'Minum 3x sehari'
  }, [appointment]);
  assert.strictEqual(rmeResult.success, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/e2e_purworejo_multitenant.test.js`  
Expected: FAIL (until all 11 prior tasks are completed).

- [ ] **Step 3: Run comprehensive verification**

Ensure all integration points pass cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/e2e_purworejo_multitenant.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e_purworejo_multitenant.test.js
git commit -m "test: add comprehensive end-to-end multi-tenant regression test suite"
```
