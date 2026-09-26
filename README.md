# SIMKLINIK — Sistem Informasi Manajemen Klinik Modern

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://simklinik-one.vercel.app/)
[![Compliance](https://img.shields.io/badge/Permenkes%20No.%2024%2F2022-Compliant-teal)]()
[![Privacy](https://img.shields.io/badge/UU%20PDP%20No.%2027%2F2022-Secure-blue)]()
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)]()

**SIMKLINIK** adalah sistem informasi manajemen klinik berbasis web yang dirancang khusus untuk memodernisasi alur pelayanan medis rawat jalan. Sistem ini mengintegrasikan seluruh siklus layanan klinik: mulai dari pendaftaran dan antrean pasien secara online/walk-in, rekam medis elektronik (RME) berstandar internasional, e-resep farmasi obat, hingga kasir pembayaran digital.

SIMKLINIK dirancang dengan mematuhi regulasi kesehatan Republik Indonesia:
1. **Permenkes No. 24 Tahun 2022**: Rekam Medis Elektronik (RME) dengan format SOAP, vital signs, kodifikasi ICD-10 WHO, dan jaminan integritas data (data terkunci permanen pasca finalisasi).
2. **UU No. 27 Tahun 2022 (UU PDP)**: Perlindungan data pribadi dan data medis sensitif pasien menggunakan *Row Level Security* (RLS) PostgreSQL dan *Audit Logging*.

---

## 🚀 Fitur Utama Berdasarkan Peran Pengguna

### 1. 🏥 Pasien Portal (`pasien.html`)
- **Reservasi Janji Temu Online**: Pemilihan poliklinik spesialis, pemilihan dokter, tanggal kunjungan, serta pemilihan sesi waktu konsultasi.
- **Pengecekan Kuota Antrean Real-time**: Indikator ketersediaan sisa kuota harian dokter sebelum konfirmasi.
- **Penerbitan Nomor Tiket Antrean Otomatis**: Antrean harian terbit otomatis jika jadwal untuk hari ini.
- **Akses Riwayat RME**: Transparansi catatan riwayat pemeriksaan medis yang telah difinalisasi dokter.
- **Resep Obat Elektronik**: Pemantauan resep obat aktif, dosis, dan petunjuk pemakaian.
- **Profil Medis Mandiri**: Pengisian golongan darah, riwayat alergi obat/makanan, dan kontak darurat.

### 2. 📋 Petugas Admisi & Kasir (`petugas.html`)
- **Pendaftaran Walk-in Kilat**: Registrasi pasien baru langsung di loket dengan auto-generate Nomor Rekam Medis (`RM-XXXXXX`).
- **Live Antrean Multi-Poli**: Monitor dan kontrol urutan antrean pasien (*Panggil*, *Layani*, *Batal*).
- **Kasir & Pelunasan Tagihan**: Penerbitan invoice otomatis (`INV-YYYY-XXXX`) yang menggabungkan tarif konsultasi dan rincian obat, mendukung metode Tunai, QRIS, Transfer, dan Debit.

### 3. 🩺 Dokter Portal (`dokter.html`)
- **Rekam Medis Elektronik Format SOAP**:
  - **S (Subjective)**: Anamnesis dan keluhan utama pasien.
  - **O (Objective)**: Tanda-tanda vital (Tekanan Darah mmHg, Nadi bpm, Suhu °C, Laju Napas RR) dan catatan pemeriksaan fisik.
  - **A (Assessment)**: Diagnosa klinis terintegrasi kodifikasi standar WHO ICD-10.
  - **P (Plan)**: Rencana terapi dan edukasi pasien.
- **Penerbitan E-Resep Terpadu**: Tabel dinamis obat, dosis, aturan minum, dan jumlah obat.
- **Finalisasi & Kunci RME**: Penyimpanan sementara (*Draft*) atau penguncian mutlak (*Final*) sesuai regulasi Permenkes No. 24/2022.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Design Tokens, Responsive Grid, Zero Inline Styles, Zero `.style.` DOM mutations), Vanilla ES6+ Modular Components.
- **Komponen UI**: Dialog modal interaktif (`assets/js/components/modal.js`) dengan penangkap fokus keyboard (*focus trap*) dan notifikasi mengambang (`assets/js/components/toast.js`).
- **Backend & Database**: **Supabase (PostgreSQL 15)** dengan 12 tabel relasional, triggers, auto-sequences, RLS policies, dan audit trail log.
- **Hosting & CI/CD**: Terhubung langsung dengan GitHub repository dan di-deploy otomatis melalui **Vercel**.

---

## 📂 Struktur Repositori

```text
SIMKLINIK/
├── assets/
│   ├── css/
│   │   ├── auth.css             # Desain portal otentikasi login & registrasi
│   │   ├── dashboard.css        # Desain dasar app shell, sidebar, dan grid
│   │   ├── landing.css          # Desain landing page publik
│   │   ├── modal.css            # Desain dialog modal dan toast notification
│   │   └── role-pages.css       # Desain khusus halaman dashboard peran
│   └── js/
│       ├── auth/
│       │   └── login.js         # Logika login SSO, brute-force lock, & registrasi
│       ├── components/
│       │   ├── modal.js         # Komponen dialog modal aksesibel
│       │   └── toast.js         # Komponen notifikasi toast
│       ├── dashboard/
│       │   └── role-dashboard.js# Controller universal dashboard pasien, petugas, & dokter
│       ├── services/
│       │   ├── appointmentService.js   # API janji temu & pengecekan kuota
│       │   ├── billingService.js       # API invoice & kasir pelunasan
│       │   ├── medicalRecordService.js # API RME SOAP & regulasi Permenkes
│       │   ├── patientService.js       # API pasien & registrasi walk-in
│       │   ├── prescriptionService.js  # API e-resep farmasi
│       │   └── queueService.js         # API antrean pelayanan multi-poli
│       └── landing.js           # Interaktivitas landing page publik
├── config/
│   ├── supabase.js              # Klien inisialisasi Supabase
│   └── supabase-complete-schema.sql # Skrip DDL, Trigger, RLS, & Seed data lengkap
├── docs/
│   ├── PRD.md                   # Product Requirements Document
│   └── superpowers/             # Desain spesifikasi dan rencana implementasi
├── index.html                   # Landing page publik profil klinik
├── login.html                   # Halaman masuk otentikasi multi-peran
├── pasien.html                  # Dashboard portal pasien
├── petugas.html                 # Dashboard portal petugas admisi & kasir
├── dokter.html                  # Dashboard portal dokter pemeriksa
└── README.md                    # Dokumentasi teknis & panduan instalasi
```

---

## ⚡ Panduan Setup Database Supabase

Untuk menjalankan fitur database relasional secara penuh di Supabase Anda:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda.
2. Di panel navigasi sebelah kiri, klik menu **SQL Editor**.
3. Buat query baru (*New Query*).
4. Salin seluruh isi dari berkas [`config/supabase-complete-schema.sql`](config/supabase-complete-schema.sql) dan tempel ke dalam SQL Editor.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
6. Supabase akan secara otomatis membuat:
   - 12 tabel PostgreSQL relasional
   - Auto-generator sequence (No. RM `RM-000001`, No. Resep `RX-YYMM-XXXX`, No. Invoice `INV-YYYY-XXXX`)
   - Triggers sinkronisasi profil akun & log audit medis/pembayaran
   - *Row Level Security (RLS)* policies yang mengisolasi akses pasien, dokter, dan staf
   - Data awal (*Seed data*) untuk Poliklinik Layanan (`POLI_UMUM`, `POLI_GIGI`, `POLI_ANAK`, `LABORATORIUM`).

---

## 🌐 Menjalankan Secara Lokal

Anda dapat menjalankan SIMKLINIK secara lokal menggunakan server statis apa pun:

```bash
# Menggunakan Node.js npx serve
npx serve .

# Atau menggunakan Python 3
python -m http.server 8080

# Atau menggunakan PHP built-in server
php -S localhost:8080
```

Buka peramban Anda di `http://localhost:8080`.

---

## 🚀 Mengunggah Pembaruan ke GitHub & Vercel

SIMKLINIK telah dikonfigurasi dengan repositori remote:
`https://github.com/Minooll/SIMKLINIK.git`

Untuk mengirimkan seluruh commit terbaru ke GitHub (yang akan memicu deployment otomatis di Vercel):
```bash
git push origin main
```
*(Jika diminta otentikasi pertama kali, selesaikan login akun GitHub Anda melalui pop-up peramban Git Credential Manager).*

---

## 📄 Lisensi & Kepatuhan
SIMKLINIK dikembangkan dengan standar medis terbuka untuk klinik pratama dan utama di Indonesia.
Memenuhi ketentuan regulasi **Permenkes No. 24 Tahun 2022** dan **UU PDP No. 27 Tahun 2022**.
