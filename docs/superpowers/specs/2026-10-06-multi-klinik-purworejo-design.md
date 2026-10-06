# Spesifikasi Desain: Platform Multi-Klinik Regional Kabupaten Purworejo

**Tanggal**: 2026-10-06  
**Status**: Draf Disetujui  
**Lingkup Wilayah**: Kabupaten Purworejo, Jawa Tengah (Kec. Purworejo Kota, Kec. Kutoarjo, Kec. Banyuurip)  
**Tujuan**: Mengubah SIMklinik dari aplikasi internal faskes tunggal menjadi platform direktori & pendaftaran multi-klinik regional, serta menyiapkan data layer untuk AI Triage & Clinic Recommender.

---

## 1. Latar Belakang & Nilai Tambah

Klinik-klinik mandiri di daerah Kabupaten Purworejo umumnya belum memiliki sistem reservasi digital mandiri. Pasien seringkali harus datang langsung untuk mengetahui apakah kuota dokter masih tersedia dan berapa antrean saat ini.

Dengan konsep agregator multi-klinik regional:
1. **User-Centric (Pasien)**: Pasien dapat mencari klinik terdekat di kecamatannya (Purworejo, Kutoarjo, Banyuurip), mengecek layanan yang tersedia, melihat beban antrean, dan mengambil nomor antrean secara online.
2. **Multi-Tenancy Ringan (Petugas)**: Petugas masing-masing klinik mengelola antrean faskesnya sendiri dengan isolasi data berbasis `clinic_id`.
3. **Kesiapan Ekosistem AI**: Data faskes (lokasi, poli, jam operasional, beban antrean) terstruktur sehingga AI Chatbot dapat memberikan rekomendasi klinik berbasis keluhan dan jarak.

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
* `profiles`: Ditambahkan kolom `clinic_id uuid references public.clinics(id) on delete set null`

### 3.3 Kompatibilitas Mundur (Backward Compatibility)
Jika baris data existing memiliki `clinic_id = null`, sistem service client-side dan SQL migrasi otomatis mengasosiasikannya ke klinik default (`KLN-PWR-01`).

---

## 4. Spesifikasi Service Layer (`clinicService.js`)

File baru: `assets/js/services/clinicService.js` (didaftarkan ke `window.clinicService`):
* `getClinics()`: Mengembalikan daftar seluruh klinik aktif di Purworejo.
* `getClinicsByDistrict(district)`: Memfilter klinik berdasarkan kecamatan (`'Purworejo'`, `'Kutoarjo'`, `'Banyuurip'`).
* `getClinicById(clinicId)`: Mendapatkan data profil satu klinik tertentu.
* `getActiveQueueCount(clinicId)`: Menghitung jumlah antrean berstatus `Menunggu` atau `Dipanggil` pada hari berjalan untuk klinik terkait.
* `getClinicServices(clinicId)`: Mendapatkan daftar poli/layanan spesifik klinik tersebut.

---

## 5. Spesifikasi Antarmuka & UX Pasien (`pasien.html`)

### 5.1 Katalog Eksplorasi Klinik di Dashboard
* **Container**: `<section class="clinics-explorer-section">` di atas riwayat janji temu.
* **Filter Pills**: `[Semua (Purworejo)]`, `[Purworejo Kota]`, `[Kutoarjo]`, `[Banyuurip]`.
* **Kartu Klinik**:
  - Badge Status Operasional (Buka / Tutup).
  - Nama Klinik, Alamat, dan No. Telepon.
  - Tag Fasilitas & Poli (`Poli Umum`, `Poli Gigi`, dll).
  - Indikator Beban Antrean Realtime (misal: `3 Pasien Menunggu`).
  - Tombol Aksi: `Daftar Antrean / Booking` $\rightarrow$ membuka modal booking dengan klinik sudah otomatis terpilih.

### 5.2 Modal Booking Janji Temu Terintegrasi
* Dropdown input baru: `#bookingClinicSelect` sebagai langkah pertama.
* Saat pengguna mengganti klinik, dropdown `#bookingServiceSelect` dan `#bookingDoctorSelect` otomatis menyaring dokter yang terdaftar di klinik tersebut.

---

## 6. Spesifikasi Antarmuka Petugas (`petugas.html`)

### 6.1 Multi-Tenant Header Switcher
* Ditambahkan widget tenant di topbar petugas:
  - Label: `Klinik Aktif: [Dropdown Switcher 3 Klinik Purworejo]`.
  - Default terpilih sesuai profil login petugas (`localStorage` / Supabase auth).
* Saat switcher diganti:
  - Antrean hari ini dimuat ulang khusus untuk klinik yang aktif.
  - Panggilan nomor antrean (`window.panggilAntrean`) memproses antrean klinik yang bersangkutan.

---

## 7. Rencana Integrasi AI Chatbot (Tahap Berikutnya)

Data klinik diekspos melalui helper `window.getClinicsContextForAi()` dengan format JSON ringkas:
```json
[
  {
    "id": "...",
    "name": "Klinik Pratama & Bersalin Kutoarjo Medika",
    "district": "Kutoarjo",
    "services": ["Poli Umum", "Poli KIA / Kebidanan", "Farmasi"],
    "operating_hours": "08:00 - 20:00",
    "active_queue_count": 2
  }
]
```
Prompt AI Chatbot dapat langsung memanfaatkan data ini untuk menjawab pertanyaan seperti:
*"Saya di Kutoarjo dan ingin periksa kandungan, klinik mana yang buka dan antreannya sedikit?"*

---

## 8. Rencana Pengujian (Testing & Verification)
1. **Database & Service Test**: Menguji `clinicService.js` (filter kecamatan, detail klinik, dan fallback).
2. **Patient Flow Test**: Menguji pendaftaran/booking antrean dengan pemilihan klinik Purworejo.
3. **Staff Flow Test**: Menguji isolasi antrean per klinik pada dashboard petugas.
4. **Regression Test**: Memastikan seluruh 15 suite pengujian unit dan E2E yang sudah ada tetap lolos 100%.
