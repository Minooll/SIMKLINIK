# SIMKLINIK — Platform Agregator Multi-Klinik Regional Kabupaten Purworejo

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://simklinik-one.vercel.app/)
[![Compliance](https://img.shields.io/badge/Permenkes%20No.%2024%2F2022-Compliant-teal)]()
[![Privacy](https://img.shields.io/badge/UU%20PDP%20No.%2027%2F2022-Secure-blue)]()
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)]()

**SIMKLINIK** adalah platform agregator layanan kesehatan dan sistem informasi manajemen klinik multi-faskes regional berbasis web yang berfokus pada **Kabupaten Purworejo, Jawa Tengah**. Platform ini mendigitalisasi jaringan klinik mandiri di tingkat kabupaten ke dalam satu ekosistem terpadu, memungkinkan pasien menemukan faskes terdekat, membandingkan antrean aktif secara real-time, dan melakukan reservasi langsung ke dokter faskes pilihan.

Arsitektur sistem menggunakan model **2-Peran Mandiri (Direct Patient-to-Doctor Interaction)** tanpa memerlukan perantara petugas loket fisik:
1. **Pasien**: Menjelajahi klinik di berbagai kecamatan di Kabupaten Purworejo, memeriksa kuota antrean hidup, memilih dokter, dan mendapatkan RME serta e-resep secara transparan.
2. **Dokter**: Terikat dengan klinik faskes aktif (`clinic_id`), memanggil antrean pasien secara langsung, mengisi RME SOAP berstandar ICD-10 WHO, dan meresepkan obat.

---

## 🏥 Jaringan 3 Klinik Percontohan (Kabupaten Purworejo)

Platform ini mengintegrasikan 3 klinik pilot yang merepresentasikan titik-titik strategis pelayanan kesehatan di Kabupaten Purworejo:

1. **Klinik Pratama Sehat Mandiri Purworejo** (`KLN-PWR-01`)
   - **Kecamatan**: Purworejo (Pusat Kota)
   - **Alamat**: Jl. Brigjen Katamso No. 42, Pangenrejo, Kec. Purworejo
   - **Layanan**: Poli Umum, Poli Gigi, Farmasi
2. **Klinik Pratama & Bersalin Kutoarjo Medika** (`KLN-PWR-02`)
   - **Kecamatan**: Kutoarjo (Wilayah Barat)
   - **Alamat**: Jl. Pangeran Diponegoro No. 18, Kec. Kutoarjo
   - **Layanan**: Poli Umum, Poli KIA / Kebidanan, UGD 24 Jam, Farmasi
3. **Klinik Pratama Keluarga Banyuurip** (`KLN-PWR-03`)
   - **Kecamatan**: Banyuurip (Wilayah Penyangga)
   - **Alamat**: Jl. Tentara Pelajar No. 88, Boro Kulon, Kec. Banyuurip
   - **Layanan**: Poli Umum, Laboratorium Darah Cepat, Farmasi

---

## 🚀 Fitur Utama Berdasarkan Peran Pengguna

### 1. 🏥 Pasien Portal (`pasien.html`)
- **Direktori & Filter Klinik Regional Purworejo**: Filter faskes berdasarkan kecamatan (*Purworejo Kota*, *Kutoarjo*, *Banyuurip*), status operasional faskes, serta beban antrean aktif.
- **Reservasi Janji Temu Multi-Klinik**: Pemilihan klinik tujuan, poliklinik spesialis, pemilihan dokter terafiliasi faskes, dan pemilihan sesi waktu kunjungan.
- **Pengecekan Kuota Antrean Real-time**: Indikator ketersediaan sisa kuota harian dokter per faskes sebelum konfirmasi janji temu.
- **Penerbitan Nomor Tiket Antrean Otomatis**: Antrean terbit otomatis dan dapat dipantau langsung dari dashboard pasien.
- **Akses Riwayat RME & E-Resep**: Transparansi catatan riwayat medis yang telah difinalisasi dokter dan obat aktif.
- **AI Recommendation Ready**: Konteks klinik dan dokter terstruktur (`window.getClinicsContextForAi()`) siap untuk asisten AI chatbot.

### 2. 🩺 Dokter Portal Mandiri (`dokter.html`)
- **Afiliasi Faskes Aktif**: Switcher faskes klinik (`#doctorClinicSelector`) di header dokter untuk mengelola antrean dan pasien sesuai klinik tugas.
- **Pemanggilan Antrean Langsung**: Dokter memanggil pasien (*Panggil*, *Mulai Periksa*, *Selesai*) langsung dari ruang periksa tanpa ketergantungan petugas admisi.
- **Rekam Medis Elektronik Format SOAP**:
  - **S (Subjective)**: Anamnesis dan keluhan utama pasien.
  - **O (Objective)**: Tanda-tanda vital (Tekanan Darah, Nadi, Suhu, Pernapasan) dan pemeriksaan fisik.
  - **A (Assessment)**: Diagnosa klinis terintegrasi kodifikasi standar WHO ICD-10.
  - **P (Plan)**: Rencana terapi dan edukasi pasien.
- **Penerbitan E-Resep Terpadu & Finalisasi RME**: Resep obat langsung terbit dan RME terkunci mutlak pasca finalisasi sesuai Permenkes No. 24/2022.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Design Tokens, Responsive Grid, Zero Inline Styles), Modular Vanilla ES6+.
- **Multi-Clinic Service**: `assets/js/services/clinicService.js` mengelola caching faskes, kalkulasi antrean aktif per klinik, filter kecamatan, dan format konteks rekomendasi AI.
- **Backend & Database**: **Supabase (PostgreSQL 15)** dengan tabel `public.clinics`, relasi `clinic_id`, Row Level Security (RLS) terisolasi, triggers, dan log audit.
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
│   │   ├── modal.css            # Desain dialog modal dan requirement checklist
│   │   └── role-pages.css       # Desain katalog klinik Purworejo & kartu faskes
│   └── js/
│       ├── auth/
│       │   └── login.js         # Autentikasi 2-peran (Pasien & Dokter), Google SSO
│       ├── components/
│       │   ├── modal.js         # Komponen dialog modal aksesibel
│       │   └── toast.js         # Komponen notifikasi toast
│       ├── dashboard/
│       │   └── role-dashboard.js# Controller dashboard pasien & dokter klinik aktif
│       └── services/
│           ├── clinicService.js        # Service direktori multi-klinik Purworejo & AI context
│           ├── appointmentService.js   # Service reservasi & filtering dokter per klinik
│           ├── queueService.js         # Service antrean mandiri dokter-pasien
│           ├── medicalRecordService.js # Service RME SOAP Permenkes No. 24/2022
│           ├── prescriptionService.js  # Service e-resep farmasi
│           └── patientService.js       # Service profil pasien & rekam medis
├── config/
│   ├── supabase.js                       # Inisialisasi klien Supabase
│   ├── supabase-complete-schema.sql      # Skema DDL tabel clinics, RLS, & triggers
│   └── supabase-seed-clinics-purworejo.sql # Data awal 3 klinik percontohan Purworejo
├── docs/
│   └── superpowers/                      # Spesifikasi & rencana multi-klinik Purworejo
├── index.html                            # Landing page publik agregator klinik
├── login.html                            # Halaman masuk otentikasi 2-peran (Pasien / Dokter)
├── pasien.html                           # Portal pasien (Katalog klinik Purworejo & Janji Temu)
├── dokter.html                           # Portal dokter mandiri & switcher klinik aktif
└── README.md                             # Dokumentasi sistem & panduan deployment
```

---

## ⚡ Panduan Setup Database Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda.
2. Di panel navigasi sebelah kiri, klik menu **SQL Editor**.
3. Jalankan berkas skema utama:
   - Salin isi dari [`config/supabase-complete-schema.sql`](config/supabase-complete-schema.sql) dan klik **Run**.
4. Jalankan berkas data seed klinik Purworejo:
   - Salin isi dari [`config/supabase-seed-clinics-purworejo.sql`](config/supabase-seed-clinics-purworejo.sql) dan klik **Run**.
5. Supabase akan memuat tabel `public.clinics` dan menghubungkan relasi `clinic_id` ke akun dan antrean.

---

## 🌐 Menjalankan Secara Lokal

```bash
# Menggunakan Node.js npx serve
npx serve .

# Atau menggunakan Python 3
python -m http.server 8080
```

Buka peramban Anda di `http://localhost:8080`.

---

## 🧪 Menjalankan Pengujian Otomatis

Seluruh pengujian unit dan integrasi dapat dijalankan menggunakan Node.js test runner bawaan:

```bash
# Menjalankan seluruh rangkaian tes otomatis
Get-ChildItem tests/*.test.js | ForEach-Object { node $_.FullName }
```

---

## 📄 Kepatuhan & Lisensi
SIMKLINIK dikembangkan dengan standar medis terbuka untuk jaringan klinik pratama dan utama regional. Memenuhi ketentuan regulasi **Permenkes No. 24 Tahun 2022** dan **UU PDP No. 27 Tahun 2022**.
