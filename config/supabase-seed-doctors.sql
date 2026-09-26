-- ============================================================
-- SIMKLINIK - SEED DATA DOKTER & JADWAL POLIKLINIK
-- Skrip ini dapat dijalankan langsung di Supabase SQL Editor
-- untuk mengisi data dummy dokter dan menghubungkannya dengan poli
-- ============================================================

-- 1. Pastikan ekstensi uuid-ossp aktif
create extension if not exists "uuid-ossp";

-- 2. Tambahkan kolom service_id pada tabel doctors jika belum ada (opsional untuk kemudahan relasi langsung)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'doctors' and column_name = 'service_id'
  ) then
    alter table public.doctors add column service_id uuid references public.services(id) on delete set null;
  end if;
end $$;

-- 3. Pastikan Master Data Poliklinik (Services) telah tersedia
insert into public.services (id, code, name, base_price, is_active)
values 
  ('b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', 'POLI_UMUM', 'Poli Umum', 60000, true),
  ('335f3cba-0e0c-4b29-83ec-b7b66316a430', 'POLI_GIGI', 'Poli Gigi & Mulut', 95000, true),
  ('aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', 'POLI_ANAK', 'Poli Spesialis Anak', 120000, true),
  ('7cbdca21-101d-4191-86b4-3317dc4401d7', 'LABORATORIUM', 'Laboratorium Klinik', 80000, true)
on conflict (code) do update set
  name = excluded.name,
  base_price = excluded.base_price,
  is_active = excluded.is_active;

-- 4. Matikan sementara RLS / constraint foreign key auth.users jika membuat akun profil dummy sistem
-- Catatan: Jika profiles.id terhubung ke auth.users, profil dokter dapat di-insert langsung dengan trigger sistem
do $$
begin
  -- ── DOKTER POLI UMUM ──
  insert into public.profiles (id, full_name, username, role)
  values
    ('11111111-1111-4111-8111-111111111111', 'dr. Ayu Rahma, Sp.PD', 'dr_ayu', 'Dokter'),
    ('11111111-1111-4111-8111-222222222222', 'dr. Dimas Putra', 'dr_dimas', 'Dokter'),
    ('11111111-1111-4111-8111-333333333333', 'dr. Hendra Wijaya', 'dr_hendra', 'Dokter'),
    -- ── DOKTER POLI GIGI ──
    ('22222222-2222-4222-8222-111111111111', 'drg. Siti Nurhaliza', 'drg_siti', 'Dokter'),
    ('22222222-2222-4222-8222-222222222222', 'drg. Rani Sari', 'drg_rani', 'Dokter'),
    ('22222222-2222-4222-8222-333333333333', 'drg. Farhan Ramadhan, Sp.KG', 'drg_farhan', 'Dokter'),
    -- ── DOKTER POLI ANAK ──
    ('33333333-3333-4333-8333-111111111111', 'dr. Anisa Triastuti, Sp.A, M.Kes', 'dr_anisa', 'Dokter'),
    ('33333333-3333-4333-8333-222222222222', 'dr. Bagus Prasetyo, Sp.A', 'dr_bagus', 'Dokter'),
    -- ── DOKTER LABORATORIUM ──
    ('44444444-4444-4444-8444-111111111111', 'dr. Budi Santoso, Sp.PK', 'dr_budi', 'Dokter'),
    ('44444444-4444-4444-8444-222222222222', 'dr. Maya Indah, Sp.PK', 'dr_maya', 'Dokter')
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = 'Dokter';
exception
  when foreign_key_violation then
    raise notice 'Foreign key auth.users aktif. Profil akan terhubung otomatis saat login dokter.';
end $$;

-- 5. Masukkan Data Dokter ke Tabel doctors
insert into public.doctors (id, profile_id, sip_number, specialization, is_active, service_id)
values
  -- Poli Umum
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'SIP-503/001/DU/2024', 'Dokter Umum / Penyakit Dalam', true, 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816'),
  ('11111111-1111-4111-8111-222222222222', '11111111-1111-4111-8111-222222222222', 'SIP-503/002/DU/2024', 'Dokter Pelayanan Umum', true, 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816'),
  ('11111111-1111-4111-8111-333333333333', '11111111-1111-4111-8111-333333333333', 'SIP-503/003/DU/2024', 'Dokter Umum Senior', true, 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816'),
  -- Poli Gigi & Mulut
  ('22222222-2222-4222-8222-111111111111', '22222222-2222-4222-8222-111111111111', 'SIP-503/010/DG/2024', 'Dokter Gigi & Mulut', true, '335f3cba-0e0c-4b29-83ec-b7b66316a430'),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'SIP-503/011/DG/2024', 'Dokter Gigi & Periodonsia', true, '335f3cba-0e0c-4b29-83ec-b7b66316a430'),
  ('22222222-2222-4222-8222-333333333333', '22222222-2222-4222-8222-333333333333', 'SIP-503/012/DG/2024', 'Spesialis Konservasi Gigi (Sp.KG)', true, '335f3cba-0e0c-4b29-83ec-b7b66316a430'),
  -- Poli Spesialis Anak
  ('33333333-3333-4333-8333-111111111111', '33333333-3333-4333-8333-111111111111', 'SIP-503/020/SPA/2024', 'Spesialis Anak & Pediatri Umum (Sp.A)', true, 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c'),
  ('33333333-3333-4333-8333-222222222222', '33333333-3333-4333-8333-222222222222', 'SIP-503/021/SPA/2024', 'Spesialis Tumbuh Kembang Anak (Sp.A)', true, 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c'),
  -- Laboratorium Klinik
  ('44444444-4444-4444-8444-111111111111', '44444444-4444-4444-8444-111111111111', 'SIP-503/030/SPPK/2024', 'Spesialis Patologi Klinik & Diagnostik (Sp.PK)', true, '7cbdca21-101d-4191-86b4-3317dc4401d7'),
  ('44444444-4444-4444-8444-222222222222', '44444444-4444-4444-8444-222222222222', 'SIP-503/031/SPPK/2024', 'Spesialis Hematologi & Analis Lab (Sp.PK)', true, '7cbdca21-101d-4191-86b4-3317dc4401d7')
on conflict (id) do update set
  specialization = excluded.specialization,
  service_id = excluded.service_id,
  is_active = excluded.is_active;

-- 6. Masukkan Jadwal Praktik Sesuai Poli (Senin - Sabtu)
insert into public.doctor_schedules (doctor_id, service_id, day_of_week, start_time, end_time, quota)
values
  -- dr. Ayu Rahma (Poli Umum - Senin s/d Jumat)
  ('11111111-1111-4111-8111-111111111111', 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', 1, '08:00:00', '12:00:00', 20),
  ('11111111-1111-4111-8111-111111111111', 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', 2, '08:00:00', '12:00:00', 20),
  ('11111111-1111-4111-8111-111111111111', 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', 3, '08:00:00', '12:00:00', 20),
  -- drg. Siti Nurhaliza (Poli Gigi - Senin s/d Sabtu)
  ('22222222-2222-4222-8222-111111111111', '335f3cba-0e0c-4b29-83ec-b7b66316a430', 1, '09:00:00', '14:00:00', 15),
  ('22222222-2222-4222-8222-111111111111', '335f3cba-0e0c-4b29-83ec-b7b66316a430', 3, '09:00:00', '14:00:00', 15),
  ('22222222-2222-4222-8222-111111111111', '335f3cba-0e0c-4b29-83ec-b7b66316a430', 5, '09:00:00', '14:00:00', 15),
  -- dr. Anisa Triastuti (Poli Anak - Selasa, Kamis, Sabtu)
  ('33333333-3333-4333-8333-111111111111', 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', 2, '10:00:00', '15:00:00', 20),
  ('33333333-3333-4333-8333-111111111111', 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', 4, '10:00:00', '15:00:00', 20),
  ('33333333-3333-4333-8333-111111111111', 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', 6, '09:00:00', '13:00:00', 15),
  -- dr. Budi Santoso (Laboratorium - Setiap Hari Kerja)
  ('44444444-4444-4444-8444-111111111111', '7cbdca21-101d-4191-86b4-3317dc4401d7', 1, '08:00:00', '16:00:00', 30),
  ('44444444-4444-4444-8444-111111111111', '7cbdca21-101d-4191-86b4-3317dc4401d7', 2, '08:00:00', '16:00:00', 30),
  ('44444444-4444-4444-8444-111111111111', '7cbdca21-101d-4191-86b4-3317dc4401d7', 3, '08:00:00', '16:00:00', 30),
  ('44444444-4444-4444-8444-111111111111', '7cbdca21-101d-4191-86b4-3317dc4401d7', 4, '08:00:00', '16:00:00', 30),
  ('44444444-4444-4444-8444-111111111111', '7cbdca21-101d-4191-86b4-3317dc4401d7', 5, '08:00:00', '16:00:00', 30)
on conflict do nothing;
