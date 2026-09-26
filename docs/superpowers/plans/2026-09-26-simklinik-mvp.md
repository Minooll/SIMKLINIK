# SIMKLINIK MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun dan merealisasikan sistem operasional klinik lengkap (SIMKLINIK) berbasis data persisten Supabase PostgreSQL (12 tabel + RLS), arsitektur modular service-layer, dan antarmuka modal interaktif multi-peran (Pasien, Dokter, Petugas).

**Architecture:** Modular Service-Layer Pattern. Seluruh query data dipisahkan ke `assets/js/services/`. Komponen interaktif form menggunakan modal dialog yang dienkapsulasi dengan CSS terpisah (`assets/css/modal.css`). Database PostgreSQL menangani integritas data, sequence No. RM, audit trigger, dan Row Level Security (RLS).

**Tech Stack:** HTML5 Semantic, Vanilla CSS3 (CSS Variables, Responsive Grid/Flexbox, Zero Inline Styles), Vanilla JavaScript ES6+, Supabase JS SDK v2, PostgreSQL with RLS.

**Spec:** [docs/superpowers/specs/2026-09-26-simklinik-mvp-design.md](../specs/2026-09-26-simklinik-mvp-design.md)

---

## Global Constraints

- Standar Rekam Medis Elektronik (RME) mematuhi **Permenkes No. 24 Tahun 2022** (format SOAP: Subjektif, Objektif/Vital Signs, Asesmen/ICD-10, Plan).
- Perlindungan data pribadi mematuhi **UU No. 27 Tahun 2022 (PDP)** dengan isolasi Row Level Security (RLS) di PostgreSQL.
- Zero inline styles: dilarang menggunakan tag `<style>` ataupun atribut `style="..."` di file HTML.
- Zero DOM `.style.` mutations: seluruh manipulasi tampilan di JavaScript wajib menggunakan class CSS (`classList.toggle`, `classList.add`, `classList.remove`).
- Seluruh file statis dapat dijalankan langsung di browser lokal atau hosting statis (Vercel) tanpa langkah build/bundler.

## Review Focus

1. **Pencegahan Double-Booking Dokter:** Validasi kuota dan constraint unik `(doctor_id, appointment_date, appointment_time)` di PostgreSQL untuk mencegah dua pasien memesan slot yang sama.
2. **Kerahasiaan Rekam Medis Antar Pasien:** Pengujian RLS negatif membuktikan pasien A tidak dapat membaca atau menulis rekam medis pasien B.
3. **Pencegahan Klik Ganda (*Idempotency*):** Tombol submit pada seluruh modal otomatis dinonaktifkan (*disabled*) dengan pemintal loading saat operasi asinkron berlangsung.
4. **Imutabilitas Rekam Medis Final:** Catatan rekam medis yang telah dibubuhi `finalized_at` tidak dapat diubah kembali (*locked*).
5. **Penanganan Kondisi Jaringan/Offline:** Pesan error dari server diterjemahkan menjadi teks yang komunikatif melalui komponen Toast notification.

---

### Task 1: Complete Supabase Database DDL & RLS Migration Script

**Files:**
- Create: `config/supabase-complete-schema.sql`
- Test: `tests/test-schema.sql`

**Interfaces:**
- Produces: 12 PostgreSQL tables (`profiles`, `patients`, `doctors`, `services`, `doctor_schedules`, `appointments`, `queue_entries`, `medical_records`, `prescriptions`, `prescription_items`, `payments`, `audit_logs`), sequences (`patient_no_rm_seq`, `prescription_no_seq`, `invoice_no_seq`), functions (`generate_no_rm()`, `record_audit_log()`), triggers, and complete RLS security policies.

- [ ] **Step 1: Tulis berkas DDL SQL lengkap 12 tabel dan sequence**
  Buat `config/supabase-complete-schema.sql` yang mencakup pembuatan tabel, foreign key constraints, default value `gen_random_uuid()`, sequence auto-number `RM-000001`, `RX-YYMM-XXXX`, dan `INV-YYYY-XXXX`.

- [ ] **Step 2: Tambahkan fungsi trigger audit log dan handle new user profile**
  Tambahkan fungsi PostgreSQL trigger `handle_new_user()` untuk sinkronisasi `auth.users` ke `public.profiles` dan fungsi `record_audit_log()` pada tabel `medical_records` dan `payments`.

- [ ] **Step 3: Terapkan kebijakan Row Level Security (RLS) lengkap pada 12 tabel**
  Aktifkan `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` dan susun kebijakan `CREATE POLICY` untuk masing-masing peran (Pasien, Dokter, Petugas) sesuai Bab 3.3 spesifikasi.

- [ ] **Step 4: Sisipkan data seed awal (Master Data Poli, Jadwal Praktik, dan Dokter Contoh)**
  Sertakan data default untuk `services` (Poli Umum, Gigi, Spesialis Anak, Lab), akun dokter contoh, dan jadwal dokter aktif mingguan.

- [ ] **Step 5: Verifikasi sintaks SQL dan commit**
  ```bash
  git add config/supabase-complete-schema.sql
  git commit -m "feat(db): add complete 12-table schema with RLS and seed data"
  ```

---

### Task 2: Reusable UI Foundation: Modal Dialog & Toast Components

**Files:**
- Create: `assets/css/modal.css`
- Create: `assets/js/components/modal.js`
- Create: `assets/js/components/toast.js`

**Interfaces:**
- Produces: 
  - `Modal.open(modalId, options)` & `Modal.close(modalId)`
  - `Toast.success(msg)`, `Toast.error(msg)`, `Toast.info(msg)`
  - CSS classes: `.modal-backdrop`, `.modal-container`, `.modal-header`, `.modal-body`, `.modal-footer`, `.toast-container`, `.toast-item`

- [ ] **Step 1: Buat stylesheet modal popup dan toast notification di `assets/css/modal.css`**
  Implementasikan styling backdrop blur, animasi scale-in, form-grid responsif, tombol submit dengan spinner state, dan toast mengambang di pojok kanan atas.

- [ ] **Step 2: Buat komponen `assets/js/components/toast.js`**
  Implementasikan helper toast otomatis yang menampilkan pesan feedback (hijau untuk sukses, merah untuk error) dan hilang sendiri setelah 4 detik.

- [ ] **Step 3: Buat komponen `assets/js/components/modal.js`**
  Implementasikan kontrol pembukaan modal, *focus trap*, penutupan via tombol Escape / backdrop click, dan manajemen tombol submit loading state.

- [ ] **Step 4: Verifikasi fungsionalitas modal & toast di browser**
  Pastikan modal membuka dengan mulus dan fokus keyboard terkunci di dalam dialog.

- [ ] **Step 5: Commit komponen UI**
  ```bash
  git add assets/css/modal.css assets/js/components/modal.js assets/js/components/toast.js
  git commit -m "feat(ui): add accessible modal and toast notification components"
  ```

---

### Task 3: Client Data Services Layer

**Files:**
- Create: `assets/js/services/patientService.js`
- Create: `assets/js/services/appointmentService.js`
- Create: `assets/js/services/queueService.js`
- Create: `assets/js/services/medicalRecordService.js`
- Create: `assets/js/services/prescriptionService.js`
- Create: `assets/js/services/billingService.js`

**Interfaces:**
- Consumes: `supabaseClient` dari `config/supabase.js`
- Produces: Asynchronous methods yang mengembalikan `{ success: true, data }` atau `{ success: false, error }`.

- [ ] **Step 1: Implementasikan `assets/js/services/patientService.js`**
  Fungsi: `getPatientProfile()`, `updateHealthProfile()`, `searchPatients(query)`, `registerPatient()`.

- [ ] **Step 2: Implementasikan `assets/js/services/appointmentService.js`**
  Fungsi: `getServicesList()`, `getDoctorsByService()`, `getDoctorSchedules()`, `checkQuota()`, `createAppointment()`, `getPatientAppointments()`, `getDoctorTodayAppointments()`.

- [ ] **Step 3: Implementasikan `assets/js/services/queueService.js`**
  Fungsi: `getTodayQueue()`, `updateQueueStatus()`, `getPatientActiveQueue()`.

- [ ] **Step 4: Implementasikan `assets/js/services/medicalRecordService.js`**
  Fungsi: `getPatientHistory()`, `saveMedicalRecord()`, `finalizeMedicalRecord()`, `getFinalizedRecord()`.

- [ ] **Step 5: Implementasikan `assets/js/services/prescriptionService.js` & `billingService.js`**
  Fungsi: `createPrescriptionWithItems()`, `getPatientActivePrescriptions()`, `calculateBill()`, `confirmPayment()`.

- [ ] **Step 6: Commit modul services**
  ```bash
  git add assets/js/services/
  git commit -m "feat(services): implement modular Supabase data access layer"
  ```

---

### Task 4: Patient Portal Integration (`pasien.html`)

**Files:**
- Modify: `pasien.html`
- Modify: `assets/js/dashboard/role-dashboard.js`
- Modify: `assets/css/role-pages.css`

**Interfaces:**
- Consumes: `patientService.js`, `appointmentService.js`, `prescriptionService.js`, `medicalRecordService.js`, `Modal`, `Toast`.
- Produces: Live dashboard pasien dengan modal interaktif "Buat Janji Temu", tabel riwayat reservasi, kartu resep aktif, detail rekam medis, dan form profil kesehatan mandiri.

- [ ] **Step 1: Tambahkan markup Modal Dialog Buat Janji & Detail Rekam Medis di `pasien.html`**
  Tambahkan struktur dialog `<dialog class="modal-dialog" id="modalBooking">` dengan step: pilih Poli, pilih Dokter, pilih Tanggal & Slot Kuota, keluhan utama.

- [ ] **Step 2: Tambahkan link stylesheet modal di `<head>` `pasien.html`**
  Sertakan `<link rel="stylesheet" href="assets/css/modal.css" />` dan script service di akhir berkas.

- [ ] **Step 3: Integrasikan data fetching dinamis di `role-dashboard.js` untuk peran Pasien**
  Gantikan data mock pasien dengan query riil:
  - Tampilkan janji temu mendatang di tabel Agenda.
  - Tampilkan resep obat aktif lengkap dengan dosis dan aturan minum.
  - Tampilkan riwayat diagnosa yang telah difinalisasi dokter.

- [ ] **Step 4: Hubungkan form Buat Janji Temu dengan `appointmentService.createAppointment`**
  Validasi sisa kuota, disable tombol saat submit, tampilkan nomor tiket antrean yang diperoleh, dan segarkan tabel otomatis.

- [ ] **Step 5: Hubungkan form update profil kesehatan mandiri**
  Simpan golongan darah, alergi obat, dan kontak darurat pasien ke tabel `patients`.

- [ ] **Step 6: Commit integrasi portal pasien**
  ```bash
  git add pasien.html assets/js/dashboard/role-dashboard.js assets/css/role-pages.css
  git commit -m "feat(patient): integrate live appointments, booking modal, and medical records"
  ```

---

### Task 5: Staff / Petugas Admisi & Kasir Portal Integration (`petugas.html`)

**Files:**
- Modify: `petugas.html`
- Modify: `assets/js/dashboard/role-dashboard.js`
- Modify: `assets/css/role-pages.css`

**Interfaces:**
- Consumes: `patientService.js`, `queueService.js`, `billingService.js`, `appointmentService.js`, `Modal`, `Toast`.
- Produces: Live monitor antrean multi-poli, modal pendaftaran pasien baru/walk-in kilat, kontrol tombol panggil antrean, dan modal kasir pembayaran lunas dengan kwitansi.

- [ ] **Step 1: Tambahkan markup Modal Pendaftaran Pasien & Modal Kasir di `petugas.html`**
  Buat dialog `#modalNewPatient` (input NIK, Nama, Tanggal Lahir, Jenis Kelamin, Poli) dan dialog `#modalPayment` (rincian tarif poli, obat, total biaya, metode bayar).

- [ ] **Step 2: Tambahkan link `modal.css` dan skrip service di `petugas.html`**
  Sertakan stylesheet dan modul service yang dibutuhkan.

- [ ] **Step 3: Integrasikan monitor antrean live dan kontrol panggil di `role-dashboard.js`**
  Tampilkan daftar antrean hari ini diurutkan per nomor (`A-001`, `B-001`), dan aktifkan tombol aksi:
  - Tombol *Panggil*: ubah status menjadi `Dipanggil`.
  - Tombol *Masuk Poli*: ubah status menjadi `Dilayani`.
  - Tombol *Batal*: batalkan antrean.

- [ ] **Step 4: Implementasikan alur pendaftaran pasien baru / walk-in**
  Simpan pasien baru via `patientService.registerPatient`, terbitkan No. RM unik otomatis, dan langsung masukkan ke antrean poli bersangkutan.

- [ ] **Step 5: Implementasikan alur kasir dan kwitansi pembayaran**
  Buka modal kasir saat kunjungan selesai poli, hitung total tagihan, catat pelunasan via `billingService.confirmPayment`, dan ubah status antrean menjadi `Selesai`.

- [ ] **Step 6: Commit integrasi portal petugas**
  ```bash
  git add petugas.html assets/js/dashboard/role-dashboard.js assets/css/role-pages.css
  git commit -m "feat(staff): integrate queue monitor, patient registration, and cashier billing"
  ```

---

### Task 6: Doctor Portal Integration (`dokter.html`)

**Files:**
- Modify: `dokter.html`
- Modify: `assets/js/dashboard/role-dashboard.js`
- Modify: `assets/css/role-pages.css`

**Interfaces:**
- Consumes: `medicalRecordService.js`, `prescriptionService.js`, `queueService.js`, `Modal`, `Toast`.
- Produces: Daftar pasien antrean dokter hari ini, slide-over / modal pemeriksaan klinis RME (format SOAP + vital signs), form penerbitan e-resep multi-obat dinamis, dan penguncian finalisasi rekam medis.

- [ ] **Step 1: Tambahkan markup Modal Pemeriksaan RME SOAP & E-Resep di `dokter.html`**
  Buat struktur form komprehensif:
  - Kotak Peringatan Alergi Pasien (merah menyala).
  - Input tanda vital grid (Tensi, Nadi, Suhu, Nafas, Berat, Tinggi).
  - Anamnesis (Subjektif) & Pemeriksaan Fisik (Objektif).
  - Diagnosis ICD-10 & Rencana Terapi (Plan).
  - Tabel dinamis item e-resep (+ Tambah Baris Obat).

- [ ] **Step 2: Tambahkan link `modal.css` dan skrip service di `dokter.html`**
  Sertakan stylesheet dan modul service yang dibutuhkan.

- [ ] **Step 3: Hubungkan aksi "Periksa Pasien" ke pembukaan Modal RME**
  Saat dokter mengklik pasien berstatus `Dilayani`, otomatis muat riwayat medis lampau pasien dan inisialisasi formulir SOAP.

- [ ] **Step 4: Implementasikan penyimpanan Draft dan Finalisasi Rekam Medis**
  - Simpan Draft: Menyimpan sementara catatan tanpa mengunci.
  - Finalisasi: Menyimpan RME permanen (`finalized_at = now()`), menerbitkan e-resep ke apotek, dan mengarahkan kunjungan ke antrean kasir.

- [ ] **Step 5: Verifikasi alur dokter di browser**
  Pastikan input tanda vital, diagnosa, dan obat tersimpan dengan foreign key yang valid.

- [ ] **Step 6: Commit integrasi portal dokter**
  ```bash
  git add dokter.html assets/js/dashboard/role-dashboard.js assets/css/role-pages.css
  git commit -m "feat(doctor): integrate SOAP medical record form, vital signs grid, and e-prescriptions"
  ```

---

### Task 7: End-to-End System Verification & Production Readiness

**Files:**
- Modify: `README.md` (Panduan eksekusi SQL Supabase & setup akun uji coba)
- Review: Seluruh file di `SIMklinik/`

- [ ] **Step 1: Uji skenario siklus hidup klinik lengkap (End-to-End Walkthrough)**
  - Pasien mendaftar online -> Terbit tiket antrean.
  - Petugas memanggil antrean -> Status berubah menjadi "Dilayani".
  - Dokter mengisi RME format SOAP & meresepkan 2 macam obat -> Finalisasi.
  - Petugas kasir menerima pembayaran -> Status lunas.
  - Pasien melihat salinan resep dan catatan diagnosa di portalnya.

- [ ] **Step 2: Audit keamanan RLS dan pencegahan klik berulang**
  Pastikan tidak ada bypass akses data dan tombol submit terproteksi saat loading.

- [ ] **Step 3: Buat dokumentasi panduan eksekusi SQL dan akun demo di README.md**
  Sediakan instruksi jelas bagaimana menjalankan `config/supabase-complete-schema.sql` di Supabase SQL Editor.

- [ ] **Step 4: Final commit dan persiapan push ke GitHub/Vercel**
  ```bash
  git add -A
  git commit -m "chore(release): complete MVP implementation ready for production deployment"
  ```
