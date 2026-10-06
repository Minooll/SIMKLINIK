# Spesifikasi Desain: Platform Multi-Klinik Regional Kabupaten Purworejo (2-Role: Pasien & Dokter)

**Tanggal**: 2026-10-06  
**Status**: Disetujui (Revisi: Eliminasi Role Petugas)  
**Lingkup Wilayah**: Kabupaten Purworejo, Jawa Tengah (Kec. Purworejo Kota, Kec. Kutoarjo, Kec. Banyuurip)  
**Tujuan**: Mengubah SIMklinik menjadi platform multi-klinik regional dengan interaksi langsung 2-role (**Pasien $\leftrightarrow$ Dokter per Klinik**), menghapus role Petugas yang redundan, dan menyiapkan integrasi AI Recommendation Chatbot.

---

## 1. Latar Belakang & Restrukturisasi Role (Direct Doctor-Patient Flow)

Sebelumnya sistem memiliki 3 role (Pasien, Petugas, Dokter). Dalam operasional klinik mandiri di daerah, alur antrean dan pemeriksaan jauh lebih efektif jika langsung menghubungkan **Pasien** dan **Dokter**:
1. **Pasien**:
   - Menjelajahi katalog klinik di Purworejo (Kec. Purworejo, Kutoarjo, Banyuurip).
   - Memilih klinik $\rightarrow$ memilih jadwal dokter $\rightarrow$ mengambil tiket antrean / booking konsultasi.
2. **Dokter**:
   - Terikat pada klinik tertentu di Purworejo (`clinic_id`).
   - Langsung memanggil nomor antrean pasien di kliniknya, melayani konsultasi, menginput RME SOAP digital, dan meresepkan obat.
3. **Eliminasi Role Petugas**:
   - Seluruh fungsionalitas operasional pemanggilan antrean dan verifikasi pasien langsung ditangani dalam panel Dokter atau otomatis oleh sistem.
   - Halaman `petugas.html` dinonaktifkan/dihapus, dan opsi role 'Petugas' pada login/registrasi dieliminasi.

---

## 2. Data Master 3 Klinik Percontohan Purworejo

| Kode Klinik | Nama Klinik | Kecamatan | Alamat | Layanan / Poli | Jam Buka |
|---|---|---|---|---|---|
| `KLN-PWR-01` | **Klinik Pratama Sehat Mandiri Purworejo** | Purworejo Kota | Jl. Brigjen Katamso No. 42, Purworejo | Poli Umum, Poli Gigi, Farmasi | 08:00 - 21:00 WIB |
| `KLN-PWR-02` | **Klinik Pratama & Bersalin Kutoarjo Medika** | Kutoarjo | Jl. Pangeran Diponegoro No. 18, Kutoarjo | Poli Umum, Poli KIA / Kebidanan, Farmasi | 24 Jam (UGD/Persalinan) / Poli: 08:00 - 20:00 |
| `KLN-PWR-03` | **Klinik Pratama Keluarga Banyuurip** | Banyuurip | Jl. Tentara Pelajar No. 88, Banyuurip | Poli Umum, Laboratorium Sederhana, Farmasi | 08:00 - 17:00 WIB |

---

## 3. Arsitektur Data & Skema Database

### 3.1 Tabel `public.clinics`
```sql
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  district text not null,
  address text not null,
  phone text,
  operating_hours text not null,
  facilities text[] not null default array['Poli Umum', 'Farmasi'],
  latitude double precision default -7.7144,
  longitude double precision default 110.0125,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 3.2 Relasi Foreign Key `clinic_id`
* `doctors`: Ditambahkan kolom `clinic_id uuid references public.clinics(id) on delete set null`
* `services`: Ditambahkan kolom `clinic_id uuid references public.clinics(id) on delete set null`
* `doctor_schedules`: Ditambahkan kolom `clinic_id uuid references public.clinics(id) on delete set null`
* `appointments`: Ditambahkan kolom `clinic_id uuid references public.clinics(id) on delete set null`
* `queue_entries`: Ditambahkan kolom `clinic_id uuid references public.clinics(id) on delete set null`
* `profiles`: Kolom role diperbarui menjadi: `check (role in ('Pasien', 'Dokter', 'Admin'))`.

---

## 4. Spesifikasi Service Layer (`clinicService.js`)

File baru: `assets/js/services/clinicService.js` (didaftarkan ke `window.clinicService`):
* `getClinics()`: Mengembalikan daftar seluruh klinik aktif di Purworejo.
* `getClinicsByDistrict(district)`: Memfilter klinik berdasarkan kecamatan (`'Purworejo'`, `'Kutoarjo'`, `'Banyuurip'`).
* `getClinicById(clinicId)`: Mendapatkan profil klinik beserta daftar dokter dan layanan.
* `getActiveQueueCount(clinicId)`: Menghitung beban antrean aktif klinik hari ini.
* `getDoctorsByClinic(clinicId)`: Mengambil daftar dokter yang berpraktek di klinik terpilih.

Integrasi ke `appointmentService.js`:
* `getDoctorsWithSchedules(clinicId)`: Menyaring dokter berdasarkan `clinic_id`.
* `bookAppointment({ clinicId, patientId, doctorId, serviceId, ... })`: Menyimpan relasi `clinic_id` pada janji temu dan antrean.

---

## 5. Portal Pasien (`pasien.html`)

1. **Section Katalog Eksplorasi Klinik Purworejo**:
   * Diletakkan di dashboard pasien.
   * Filter Pills: `[Semua]`, `[Purworejo Kota]`, `[Kutoarjo]`, `[Banyuurip]`.
   * Kartu Klinik: Nama, Alamat, Jam Operasional, Tag Fasilitas/Poli, Indikator Antrean Realtime, dan Tombol *"Daftar di Klinik Ini"*.
2. **Formulir Booking Janji Temu**:
   * Dropdown `#bookingClinicSelect` sebagai pemilih faskes.
   * Pemilihan klinik secara reaktif memfilter daftar dokter dan poli yang tersedia.
   * Tombol *"Daftar di Klinik Ini"* pada kartu klinik langsung membuka modal booking dengan klinik yang bersangkutan sudah otomatis terpilih.

---

## 6. Portal Dokter (`dokter.html`)

1. **Afiliasi Klinik & Demo Switcher**:
   * Header dokter menampilkan badge faskes: `🏥 [Klinik Pratama Sehat Mandiri Purworejo]`.
   * Switcher klinik untuk mode pengujian/demo multi-klinik Purworejo.
2. **Panggilan & Pelayanan Antrean Langsung**:
   * Dokter melihat daftar antrean pasien kliniknya untuk hari ini.
   * Dokter memanggil pasien (`Panggil Antrean`) $\rightarrow$ memeriksa pasien $\rightarrow$ mengisi RME SOAP & Resep obat.

---

## 7. Eliminasi Role Petugas & Pembersihan Kode

1. **Halaman & Navigasi**:
   * Hapus / alihkan `petugas.html` (redirect ke `dokter.html` atau `index.html`).
   * Hapus tab/pilihan "Petugas" pada `login.html`.
2. **Dashboard Script**:
   * Bersihkan kode `initPetugasPortal` dan handler petugas yang tidak lagi dipakai dari `assets/js/dashboard/role-dashboard.js`.
3. **Database Check Constraint**:
   * Sederhanakan role di `profiles.role` menjadi `Pasien` dan `Dokter` (plus `Admin` sistem jika diperlukan).

---

## 8. Kesiapan Integrasi AI Chatbot (Follow-up Milestone)

* Fungsi `window.getClinicsContextForAi()` mengekspor metadata klinik (nama, kecamatan, poli, jam buka, beban antrean) agar AI Chatbot dapat merekomendasikan faskes dan dokter yang paling tepat berdasarkan keluhan pasien dan lokasinya di Purworejo.

---

## 9. Rencana Pasca-Implementasi (Post-Implementation Requirement)

> **MANDATORY POST-STABILIZATION TASK**:  
> Setelah seluruh arsitektur 2-role multi-klinik ini selesai diubah, diverifikasi, dan berjalan tanpa error:
> 1. Buat **PRD Baru** yang secara komprehensif mendokumentasikan sistem Multi-Klinik Regional Purworejo (2-Role: Pasien & Dokter, Direktori Faskes, Alur Booking, Integrasi RME SOAP, dan Kesiapan AI Chatbot).
> 2. Hapus file-file PRD lama yang sudah usang (`docs/PRD.md`, `build_prd_pdf.js`, `prd_content.html`, `prd_presentation.html`, `prd.pdf`).
