# Struktur SIMKLINIK

## Prinsip

Kode dikelompokkan berdasarkan tanggung jawab fitur. Halaman HTML di root tetap dipertahankan sebagai entry point agar URL lama tidak rusak.

## Folder

- `assets/css/`: stylesheet berdasarkan area aplikasi.
  - `auth.css`: halaman login dan registrasi.
  - `dashboard.css`: layout dashboard bersama.
  - `role-pages.css`: komponen halaman fitur per role.
- `assets/js/auth/`: alur login, registrasi, lockout, dan OAuth.
- `assets/js/dashboard/`: router dashboard dan perilaku halaman role.
- `config/`: konfigurasi integrasi dan skema database Supabase.
- `docs/`: dokumentasi produk dan arsitektur.
- `*.html`: entry point halaman yang dapat dibuka langsung dari hosting statis.

## Aturan Perubahan

1. Tambahkan logika autentikasi di `assets/js/auth/`, bukan di HTML.
2. Tambahkan tampilan bersama dashboard di `assets/css/dashboard.css`.
3. Tambahkan variasi tampilan role di `assets/css/role-pages.css`.
4. Simpan kredensial publik dan perubahan skema Supabase di `config/`.
5. Saat menambah asset, gunakan path relatif dari HTML yang memakainya.
