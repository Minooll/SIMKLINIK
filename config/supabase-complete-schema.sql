-- ============================================================
-- SIMKLINIK COMPLETE POSTGRESQL & ROW LEVEL SECURITY (RLS) SCHEMA
-- Standard: Permenkes No. 24 Tahun 2022 & UU PDP No. 27 Tahun 2022
-- ============================================================

-- 0. EXTENSIONS & SEQUENCES
create extension if not exists "uuid-ossp";

create sequence if not exists patient_no_rm_seq start 1;
create sequence if not exists prescription_no_seq start 1;
create sequence if not exists invoice_no_seq start 1;

-- Functions to generate auto numbers
create or replace function public.generate_no_rm()
returns text language sql as $$
  select 'RM-' || lpad(nextval('patient_no_rm_seq')::text, 6, '0');
$$;

create or replace function public.generate_prescription_no()
returns text language sql as $$
  select 'RX-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('prescription_no_seq')::text, 4, '0');
$$;

create or replace function public.generate_invoice_no()
returns text language sql as $$
  select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_no_seq')::text, 5, '0');
$$;

-- 1. PROFILES (Hubungan ke auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  role text not null default 'Pasien' check (role in ('Pasien', 'Dokter', 'Petugas', 'Perawat', 'Admin', 'Kasir/Resepsionis')),
  created_at timestamptz not null default now()
);

-- Helper to fetch active user role
create or replace function public.get_current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. PATIENTS
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  no_rm text unique not null default public.generate_no_rm(),
  nik text,
  birth_date date,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  blood_type text check (blood_type in ('A', 'B', 'AB', 'O', '-')),
  allergies text default 'Tidak ada alergi yang tercatat',
  phone text,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz not null default now()
);

-- 3. DOCTORS
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  sip_number text unique not null,
  specialization text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. SERVICES (Master Data Poli & Fasilitas)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  base_price numeric not null default 50000 check (base_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. DOCTOR SCHEDULES
create table if not exists public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7), -- 1: Senin, 7: Minggu
  start_time time not null,
  end_time time not null,
  quota int not null default 20 check (quota > 0),
  created_at timestamptz not null default now()
);

-- 6. APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  appointment_date date not null,
  appointment_time time not null,
  chief_complaint text not null,
  status text not null default 'Terjadwal' check (status in ('Terjadwal', 'Dipanggil', 'Dilayani', 'Selesai', 'Dibatalkan')),
  created_at timestamptz not null default now(),
  constraint unique_doctor_timeslot unique (doctor_id, appointment_date, appointment_time)
);

-- 7. QUEUE ENTRIES
create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  queue_number text not null,
  sequence_num int not null,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Dipanggil', 'Dilayani', 'Selesai', 'Batal')),
  called_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. MEDICAL RECORDS (RME Format SOAP Permenkes No. 24/2022)
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  subjective text not null, -- Anamnesis / keluhan utama
  vital_signs jsonb not null default '{"systolic": 120, "diastolic": 80, "heart_rate": 78, "temperature": 36.5, "respiratory_rate": 18, "weight": 60, "height": 165}'::jsonb,
  objective text not null, -- Pemeriksaan fisik
  diagnosis_icd10 text not null, -- Kode ICD-10 & nama diagnosa
  assessment text, -- Analisis dokter
  treatment_plan text not null, -- Terapi & edukasi kontrol
  finalized_at timestamptz, -- Bila diisi, catatan medikolegal terkunci
  created_at timestamptz not null default now()
);

-- 9. PRESCRIPTIONS & PRESCRIPTION ITEMS (E-Resep Digital)
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  medical_record_id uuid not null references public.medical_records(id) on delete cascade,
  prescription_number text unique not null default public.generate_prescription_no(),
  status text not null default 'Diterbitkan' check (status in ('Draft', 'Diterbitkan', 'Disiapkan', 'Selesai')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medicine_name text not null,
  dosage text not null,
  frequency text not null,
  instructions text not null,
  quantity int not null default 1 check (quantity > 0)
);

-- 10. PAYMENTS (Kasir & Billing)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  invoice_number text unique not null default public.generate_invoice_no(),
  total_amount numeric not null default 0 check (total_amount >= 0),
  payment_method text check (payment_method in ('Tunai', 'Transfer', 'QRIS')),
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Lunas', 'Dibatalkan')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- 11. AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGERS & AUTOMATION
-- ============================================================

-- A. Auto create profile & patient record when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_role text;
  new_patient_id uuid;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'Pasien');
  
  insert into public.profiles (id, full_name, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)),
    user_role
  )
  on conflict (id) do nothing;

  -- Jika role Pasien, otomatis buatkan row di tabel patients
  if user_role = 'Pasien' then
    insert into public.patients (profile_id, no_rm, phone)
    values (
      new.id,
      public.generate_no_rm(),
      coalesce(new.raw_user_meta_data->>'phone', '')
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- B. Audit Trail Trigger
create or replace function public.process_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id)::text,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(NEW) else null end
  );
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists audit_medical_records on public.medical_records;
create trigger audit_medical_records
after insert or update or delete on public.medical_records
for each row execute procedure public.process_audit_log();

drop trigger if exists audit_payments on public.payments;
create trigger audit_payments
after insert or update or delete on public.payments
for each row execute procedure public.process_audit_log();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.services enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.queue_entries enable row level security;
alter table public.medical_records enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES
drop policy if exists "Profiles read access" on public.profiles;
create policy "Profiles read access" on public.profiles for select
using (auth.uid() is not null);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

-- SERVICES & SCHEDULES (Publik & Terautentikasi dapat membaca)
drop policy if exists "Services read access" on public.services;
create policy "Services read access" on public.services for select using (true);

drop policy if exists "Schedules read access" on public.doctor_schedules;
create policy "Schedules read access" on public.doctor_schedules for select using (true);

-- DOCTORS
drop policy if exists "Doctors read access" on public.doctors;
create policy "Doctors read access" on public.doctors for select using (true);

-- PATIENTS
drop policy if exists "Patients select policy" on public.patients;
create policy "Patients select policy" on public.patients for select to authenticated
using (
  profile_id = auth.uid() or 
  public.get_current_user_role() in ('Petugas', 'Dokter', 'Admin', 'Kasir/Resepsionis')
);

drop policy if exists "Patients insert policy" on public.patients;
create policy "Patients insert policy" on public.patients for insert to authenticated
with check (
  profile_id = auth.uid() or 
  public.get_current_user_role() in ('Petugas', 'Admin')
);

drop policy if exists "Patients update policy" on public.patients;
create policy "Patients update policy" on public.patients for update to authenticated
using (
  profile_id = auth.uid() or 
  public.get_current_user_role() in ('Petugas', 'Admin')
);

-- APPOINTMENTS
drop policy if exists "Appointments select policy" on public.appointments;
create policy "Appointments select policy" on public.appointments for select to authenticated
using (
  patient_id in (select id from public.patients where profile_id = auth.uid()) or
  doctor_id in (select id from public.doctors where profile_id = auth.uid()) or
  public.get_current_user_role() in ('Petugas', 'Admin', 'Kasir/Resepsionis')
);

drop policy if exists "Appointments insert policy" on public.appointments;
create policy "Appointments insert policy" on public.appointments for insert to authenticated
with check (
  patient_id in (select id from public.patients where profile_id = auth.uid()) or
  public.get_current_user_role() in ('Petugas', 'Admin')
);

drop policy if exists "Appointments update policy" on public.appointments;
create policy "Appointments update policy" on public.appointments for update to authenticated
using (
  patient_id in (select id from public.patients where profile_id = auth.uid()) or
  doctor_id in (select id from public.doctors where profile_id = auth.uid()) or
  public.get_current_user_role() in ('Petugas', 'Admin')
);

-- QUEUE ENTRIES
drop policy if exists "Queue select policy" on public.queue_entries;
create policy "Queue select policy" on public.queue_entries for select using (true);

drop policy if exists "Queue modify policy" on public.queue_entries;
create policy "Queue modify policy" on public.queue_entries for all to authenticated
using (
  public.get_current_user_role() in ('Petugas', 'Dokter', 'Admin')
);

-- MEDICAL RECORDS
drop policy if exists "Medical records select policy" on public.medical_records;
create policy "Medical records select policy" on public.medical_records for select to authenticated
using (
  (patient_id in (select id from public.patients where profile_id = auth.uid()) and finalized_at is not null) or
  doctor_id in (select id from public.doctors where profile_id = auth.uid()) or
  public.get_current_user_role() = 'Admin'
);

drop policy if exists "Medical records insert/update policy" on public.medical_records;
create policy "Medical records insert/update policy" on public.medical_records for all to authenticated
using (
  doctor_id in (select id from public.doctors where profile_id = auth.uid()) or
  public.get_current_user_role() = 'Admin'
);

-- PRESCRIPTIONS & ITEMS
drop policy if exists "Prescriptions select policy" on public.prescriptions;
create policy "Prescriptions select policy" on public.prescriptions for select to authenticated
using (
  medical_record_id in (
    select id from public.medical_records 
    where patient_id in (select id from public.patients where profile_id = auth.uid())
  ) or
  public.get_current_user_role() in ('Dokter', 'Petugas', 'Admin')
);

drop policy if exists "Prescriptions modify policy" on public.prescriptions;
create policy "Prescriptions modify policy" on public.prescriptions for all to authenticated
using (
  public.get_current_user_role() in ('Dokter', 'Admin')
);

drop policy if exists "Prescription items select policy" on public.prescription_items;
create policy "Prescription items select policy" on public.prescription_items for select using (true);

drop policy if exists "Prescription items modify policy" on public.prescription_items;
create policy "Prescription items modify policy" on public.prescription_items for all to authenticated
using (
  public.get_current_user_role() in ('Dokter', 'Admin')
);

-- PAYMENTS
drop policy if exists "Payments select policy" on public.payments;
create policy "Payments select policy" on public.payments for select to authenticated
using (
  appointment_id in (
    select id from public.appointments 
    where patient_id in (select id from public.patients where profile_id = auth.uid())
  ) or
  public.get_current_user_role() in ('Petugas', 'Kasir/Resepsionis', 'Admin')
);

drop policy if exists "Payments modify policy" on public.payments;
create policy "Payments modify policy" on public.payments for all to authenticated
using (
  public.get_current_user_role() in ('Petugas', 'Kasir/Resepsionis', 'Admin')
);

-- AUDIT LOGS
drop policy if exists "Audit logs read policy" on public.audit_logs;
create policy "Audit logs read policy" on public.audit_logs for select to authenticated
using (public.get_current_user_role() = 'Admin');

-- ============================================================
-- SEED INITIAL MASTER DATA
-- ============================================================

insert into public.services (code, name, base_price)
values 
  ('POLI_UMUM', 'Poli Umum', 60000),
  ('POLI_GIGI', 'Poli Gigi & Mulut', 95000),
  ('POLI_ANAK', 'Poli Spesialis Anak', 120000),
  ('LABORATORIUM', 'Laboratorium Klinik', 80000)
on conflict (code) do nothing;
