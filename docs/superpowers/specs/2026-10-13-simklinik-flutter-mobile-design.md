# Desain Teknis Arsitektur SIMKLINIK Mobile Flutter (SIMKlinik_android)

**Tanggal:** 13 Oktober 2026  
**Status:** Validated & Approved  
**Target Platform:** Android & Cross-Platform Mobile (Flutter SDK)  
**Lokasi Direktori:** `SIMKlinik_android/`  
**Referensi:** PRD & Arsitektur `SIMklinik_Web/docs/` (Multi-Tenant Regional Purworejo)

---

## 1. Ringkasan Eksekutif & Tujuan

Membangun aplikasi mobile Flutter mandiri di direktori `SIMKlinik_android` yang mereplikasi seluruh kapabilitas, logika bisnis, dan aturan keamanan dari `SIMklinik_Web`. Aplikasi ini melayani 3 peran pemangku kepentingan di fasilitas kesehatan Kabupaten Purworejo:
1. **Pemilik Klinik (*Clinic Owner*):** Manajemen identitas klinik Purworejo, penerbitan kode unik kriptografis dokter, alokasi dokter dan kuota harian.
2. **Dokter (*Medical Practitioner*):** Otentikasi aman terikat kode unik klinik, pemantauan antrean hari ini, formulir rekam medis elektronik (RME SOAP) aktif otomatis, otomasi antrean sekuensial atomik, serta proteksi pembatalan 12 jam.
3. **Pasien (*Patient*):** Eksplorasi katalog klinik per kecamatan di Purworejo, indikator keramaian antrean (<5 lengang, 5-10 sedang, >10 padat), AI Copilot Sasa (Google Gemini 2.0 Flash) dengan smart action booking, onboarding data medis wajib (KK, NIK 16 digit, golongan darah, alergi), booking kuota dengan peringatan pembatalan 12 jam, e-ticket antrean live, serta riwayat RME.

---

## 2. Arsitektur Perangkat Lunak (Feature-First Clean Architecture dengan BLoC)

### 2.1 Pola Arsitektur
Aplikasi mengadopsi **Clean Architecture** dengan pendekatan **Feature-First** dan manajemen state teruji **`flutter_bloc`**:

```text
SIMKlinik_android/
├── android/                             # Android native host config (Manifest, Gradle)
├── assets/                              # Aset gambar, ikon, atau logo klinik
├── lib/
│   ├── core/                            # Komponen transversal & infrastruktur dasar
│   │   ├── config/
│   │   │   ├── supabase_config.dart     # Klien Supabase (URL, anonKey)
│   │   │   └── gemini_config.dart       # Konfigurasi REST API Gemini 2.0 Flash
│   │   ├── errors/
│   │   │   ├── exceptions.dart          # Custom Exceptions
│   │   │   └── failures.dart            # Equatable Failures untuk BLoC
│   │   ├── theme/
│   │   │   ├── app_colors.dart          # Clean Clinical Tech Color Palette
│   │   │   └── app_theme.dart           # ThemeData Material 3
│   │   ├── utils/
│   │   │   ├── cancellation_guard.dart  # Rumus pembatalan 12 jam
│   │   │   ├── crowd_indicator.dart     # Hitung status beban antrean
│   │   │   └── date_formatter.dart      # Format tanggal/jam standar Purworejo
│   │   └── widgets/                     # Reusable widgets (CustomButton, CustomTextField, StatusBadge)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── models/user_session_model.dart
│   │   │   │   └── datasources/auth_remote_datasource.dart
│   │   │   ├── bloc/
│   │   │   │   ├── auth_bloc.dart
│   │   │   │   ├── auth_event.dart
│   │   │   │   └── auth_state.dart
│   │   │   └── presentation/pages/login_page.dart
│   │   ├── clinic/
│   │   │   ├── data/
│   │   │   │   ├── models/clinic_model.dart
│   │   │   │   ├── models/doctor_model.dart
│   │   │   │   └── datasources/clinic_remote_datasource.dart
│   │   │   ├── bloc/
│   │   │   │   ├── clinic_bloc.dart
│   │   │   │   ├── clinic_event.dart
│   │   │   │   └── clinic_state.dart
│   │   │   └── presentation/pages/clinic_catalog_page.dart
│   │   ├── appointment/
│   │   │   ├── data/
│   │   │   │   ├── models/appointment_model.dart
│   │   │   │   └── datasources/appointment_remote_datasource.dart
│   │   │   ├── bloc/
│   │   │   │   ├── appointment_bloc.dart
│   │   │   │   ├── appointment_event.dart
│   │   │   │   └── appointment_state.dart
│   │   │   └── presentation/pages/booking_page.dart
│   │   ├── queue/
│   │   │   ├── data/
│   │   │   │   └── datasources/queue_remote_datasource.dart
│   │   │   ├── bloc/
│   │   │   │   ├── queue_bloc.dart
│   │   │   │   ├── queue_event.dart
│   │   │   │   └── queue_state.dart
│   │   │   └── presentation/pages/live_queue_page.dart
│   │   ├── rme/
│   │   │   ├── data/
│   │   │   │   ├── models/medical_record_model.dart
│   │   │   │   └── datasources/rme_remote_datasource.dart
│   │   │   ├── bloc/
│   │   │   │   ├── rme_bloc.dart
│   │   │   │   ├── rme_event.dart
│   │   │   │   └── rme_state.dart
│   │   │   └── presentation/pages/doctor_rme_page.dart
│   │   ├── patient/
│   │   │   └── presentation/pages/
│   │   │       ├── patient_dashboard_page.dart
│   │   │       ├── patient_onboarding_dialog.dart
│   │   │       └── patient_history_page.dart
│   │   ├── owner/
│   │   │   └── presentation/pages/owner_dashboard_page.dart
│   │   └── ai_chat/
│   │       ├── data/
│   │       │   ├── models/chat_message_model.dart
│   │       │   └── datasources/ai_chat_remote_datasource.dart
│   │       ├── bloc/
│   │       │   ├── ai_chat_bloc.dart
│   │       │   ├── ai_chat_event.dart
│   │       │   └── ai_chat_state.dart
│   │       └── presentation/
│   │           ├── pages/ai_chat_page.dart
│   │           └── widgets/ai_floating_button.dart
│   └── main.dart
├── test/
│   ├── unit/
│   │   ├── cancellation_guard_test.dart
│   │   ├── crowd_indicator_test.dart
│   │   ├── referral_validator_test.dart
│   │   └── action_token_parser_test.dart
│   └── bloc/
│       ├── appointment_bloc_test.dart
│       ├── auth_bloc_test.dart
│       └── rme_bloc_test.dart
├── pubspec.yaml
└── README.md
```

---

## 3. Spesifikasi Modul & Logika Bisnis Kunci

### 3.1 Strict Cancellation Guard (Aturan Pembatalan 12 Jam)
* Rumus: $\Delta t = T_{\text{jadwal}} - T_{\text{sekarang}} \ge 12\text{ jam}$
* Implementasi pada `CancellationGuard.isCancellationAllowed(DateTime scheduledAt, [DateTime? now])`:
  - Jika $\Delta t \ge 12$ jam: return `true`. Tombol pembatalan di UI diberi warna merah (`AppColors.dangerRed`) dan interaktif.
  - Jika $\Delta t < 12$ jam: return `false`. Tombol dinonaktifkan (`disabled`, warna `AppColors.disabledGrey`), dan jika dipaksa panggil repository akan melempar `CancellationNotAllowedFailure`.

### 3.2 Indikator Keramaian Antrean
* Implementasi pada `CrowdIndicator.calculate(int queueCount)`:
  - `< 5`: `CrowdStatus.lengang` (Label: "Antrean Lengang (< 5)", Hijau `#16a34a`)
  - `5 - 10`: `CrowdStatus.sedang` (Label: "Antrean Sedang (5-10)", Oranye `#d97706`)
  - `> 10`: `CrowdStatus.padat` (Label: "Antrean Padat (> 10)", Merah `#dc2626`)

### 3.3 Otentikasi Multi-Peran & Proteksi Kode Unik Dokter
* Format kode unik referral: `^PWR-[A-Z0-9]{2,10}-[A-Z0-9]{6}$` (contoh: `PWR-SEHAT-9X8K2M`).
* Proteksi Brute-force: Menyimpan jumlah percobaan per sesi/perangkat. 3x salah berturut-turut memicu penguncian selama 15 menit (`RateLimitFailure`).

### 3.4 Alur Rekam Medis (RME SOAP) Sekuensial Atomik
* Ketika dokter menekan tombol "Selesai & Simpan RME":
  1. Data SOAP disimpan ke tabel `medical_records`.
  2. Status appointment saat ini diubah menjadi `selesai`.
  3. Mengambil antrean berikutnya berstatus `menunggu` pada dokter dan tanggal yang sama, mengubah statusnya menjadi `sedang_diperiksa`.
  4. Layar RME dokter secara instan mengosongkan input dan memuat data pasien berikutnya.

### 3.5 Asisten AI Sasa (Gemini 2.0 Flash)
* Endpoint REST: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}`
* Mendukung multi-turn chat (`contents: [{ role, parts: [{ text }] }]`).
* Parsing token rekomendasi: `[ACTION:BOOK, CLINIC_ID: "...", DOCTOR_ID: "..."]` yang diterjemahkan menjadi widget tombol di chat message.
* Out-of-Scope Rule: Menjawab pertanyaan umum dalam 1-2 kalimat sopan lalu mengarahkan kembali ke topik kesehatan & faskes Purworejo.

---

## 4. Rencana Pengujian

1. **Unit Test:**
   - `cancellation_guard_test.dart`: Memastikan ketepatan batas 12 jam (12 jam 1 menit vs 11 jam 59 menit).
   - `crowd_indicator_test.dart`: Validasi batas nilai 4 (lengang), 5 & 10 (sedang), 11 (padat).
   - `referral_validator_test.dart`: Format regex kode unik dan rate-limiting 3x percobaan.
   - `action_token_parser_test.dart`: Ekstraksi ID klinik & dokter dari balasan AI.
2. **BLoC Test:**
   - Menguji event, transisi state (Initial -> Loading -> Success / Error) pada `AuthBloc`, `AppointmentBloc`, dan `RmeBloc`.

---

## 5. Kepatuhan & Non-Functional Requirements (NFR)
1. **Permenkes No. 24/2022:** Field SOAP lengkap dan identitas NIK 16 digit & KK wajib.
2. **UU PDP No. 27/2022:** Data isolasi per tenant/klinik dan hak akses dokter terikat kode unik.
3. **UI/UX Standar Mobile:** Material 3 dengan responsivitas mobile phone (360dp - 600dp).
