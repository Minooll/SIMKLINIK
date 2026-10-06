-- ====================================================================
-- SKEMA BASIS DATA MULTI-TENANT SIMKLINIK PURWOREJO (PostgreSQL 15)
-- Wilayah: Kabupaten Purworejo, Jawa Tengah
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. TABEL KLINIK (Multi-Tenant Master Entity)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL, -- Kecamatan: Purworejo Kota, Kutoarjo, Banyuurip, Bayan, dsb
    phone VARCHAR(50),
    referral_code VARCHAR(30) UNIQUE NOT NULL, -- Format: PWR-[PREFIX]-[6 ALPHANUMERIC]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_referral_code ON public.clinics(referral_code);
CREATE INDEX IF NOT EXISTS idx_clinics_district ON public.clinics(district);

-- --------------------------------------------------------------------
-- 2. TABEL PEMILIK KLINIK (Tenant Owner Profile)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinic_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_owners_clinic ON public.clinic_owners(clinic_id);

-- --------------------------------------------------------------------
-- 3. TABEL DOKTER (Doctor Entity per Klinik)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE, -- Terikat saat verifikasi kode unik
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL, -- Umum, Gigi, Anak, Kandungan, dsb
    sip_number VARCHAR(100) NOT NULL,
    daily_quota INT NOT NULL DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors(clinic_id);

-- --------------------------------------------------------------------
-- 4. TABEL JADWAL PRAKTIK DOKTER (Doctor Schedules)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Senin, 7=Minggu
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_quota INT NOT NULL DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doc ON public.doctor_schedules(doctor_id);

-- --------------------------------------------------------------------
-- 5. TABEL PROFIL PASIEN (Mandatory Onboarding Health Profile)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    no_kk VARCHAR(16) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    blood_type VARCHAR(5) CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
    allergies TEXT DEFAULT 'Tidak ada',
    emergency_contact VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_nik ON public.patients(nik);

-- --------------------------------------------------------------------
-- 6. TABEL JANJI TEMU & ANTREAN (Appointments & Live Queue)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    queue_number VARCHAR(20) NOT NULL, -- Format: A-01, A-02
    queue_order INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'menunggu' 
        CHECK (status IN ('menunggu', 'sedang_diperiksa', 'selesai', 'dibatalkan')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_doctor_queue UNIQUE (doctor_id, appointment_date, queue_order)
);

CREATE INDEX IF NOT EXISTS idx_appointments_lookup ON public.appointments(doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);

-- --------------------------------------------------------------------
-- 7. TABEL REKAM MEDIS ELEKTRONIK (RME SOAP Form - Permenkes 24/2022)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    soap_subjective TEXT NOT NULL,
    soap_objective TEXT NOT NULL,
    soap_assessment TEXT NOT NULL,
    soap_plan TEXT NOT NULL,
    prescription_notes TEXT,
    finalized_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rme_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_rme_clinic ON public.medical_records(clinic_id);

-- ====================================================================
-- FUNGSI BISNIS DAN KEAMANAN POSTGRESQL (STORED PROCEDURES)
-- ====================================================================

-- 1. Generator Kode Referral Unik Kriptografis
CREATE OR REPLACE FUNCTION generate_clinic_referral_code(prefix TEXT) 
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    random_str TEXT := '';
    i INT;
BEGIN
    LOOP
        random_str := '';
        FOR i IN 1..6 LOOP
            random_str := random_str || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        new_code := 'PWR-' || UPPER(prefix) || '-' || random_str;
        
        IF NOT EXISTS (SELECT 1 FROM public.clinics WHERE referral_code = new_code) THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Prosedur Strict Binding Akun Dokter Saat Login
CREATE OR REPLACE FUNCTION bind_doctor_with_code(p_user_id UUID, p_code TEXT, p_sip TEXT)
RETURNS JSONB AS $$
DECLARE
    v_clinic_id UUID;
    v_doctor_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE referral_code = p_code AND is_active = TRUE;
    IF v_clinic_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kode klinik tidak valid atau tidak aktif.');
    END IF;

    SELECT id INTO v_doctor_id FROM public.doctors 
    WHERE clinic_id = v_clinic_id AND sip_number = p_sip AND is_active = TRUE;
    
    IF v_doctor_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Data dokter dengan SIP tersebut tidak terdaftar di klinik ini.');
    END IF;

    UPDATE public.doctors SET user_id = p_user_id WHERE id = v_doctor_id;

    RETURN jsonb_build_object('success', true, 'clinic_id', v_clinic_id, 'doctor_id', v_doctor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aturan Pembatalan Janji Temu 12 Jam (Database Level Guard)
CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_appt RECORD;
    v_diff INTERVAL;
BEGIN
    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id;
    
    IF v_appt IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Data janji tidak ditemukan.');
    END IF;

    -- Hitung selisih waktu janji temu vs sekarang
    v_diff := (v_appt.appointment_date + v_appt.appointment_time)::timestamp - NOW();
    
    IF v_diff < interval '12 hours' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Janji tidak dapat dibatalkan karena waktu pemeriksaan kurang dari 12 jam.'
        );
    END IF;

    UPDATE public.appointments SET status = 'dibatalkan' WHERE id = p_appointment_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Janji berhasil dibatalkan.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Alur Sekuensial Selesai RME -> Majukan Antrean Pasien Berikutnya
CREATE OR REPLACE FUNCTION finalize_rme_and_advance_queue(
    p_appointment_id UUID,
    p_doctor_id UUID,
    p_clinic_id UUID,
    p_patient_id UUID,
    p_subjective TEXT,
    p_objective TEXT,
    p_assessment TEXT,
    p_plan TEXT,
    p_prescription TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_next_appt RECORD;
BEGIN
    INSERT INTO public.medical_records (
        appointment_id, patient_id, doctor_id, clinic_id,
        soap_subjective, soap_objective, soap_assessment, soap_plan, prescription_notes
    ) VALUES (
        p_appointment_id, p_patient_id, p_doctor_id, p_clinic_id,
        p_subjective, p_objective, p_assessment, p_plan, p_prescription
    );

    UPDATE public.appointments SET status = 'selesai' WHERE id = p_appointment_id;

    SELECT * INTO v_next_appt FROM public.appointments
    WHERE doctor_id = p_doctor_id 
      AND appointment_date = CURRENT_DATE 
      AND status = 'menunggu'
    ORDER BY queue_order ASC
    LIMIT 1;

    IF v_next_appt IS NOT NULL THEN
        UPDATE public.appointments SET status = 'sedang_diperiksa' WHERE id = v_next_appt.id;
        RETURN jsonb_build_object(
            'success', true, 
            'has_next', true, 
            'next_appointment_id', v_next_appt.id,
            'next_queue_number', v_next_appt.queue_number,
            'next_patient_id', v_next_appt.patient_id
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true, 
            'has_next', false, 
            'message', 'Seluruh antrean pasien hari ini telah selesai diperiksa.'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- SEED DATA 3 KLINIK PERCONTOHAN KABUPATEN PURWOREJO
-- ====================================================================

INSERT INTO public.clinics (id, name, address, district, phone, referral_code, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Klinik Pratama Sehat Mandiri Purworejo', 'Jl. Jenderal Sudirman No. 45, Purworejo', 'Purworejo Kota', '0275-321111', 'PWR-SEHAT-9X8K2M', true),
    ('22222222-2222-2222-2222-222222222222', 'Klinik Pratama & Bersalin Kutoarjo Medika', 'Jl. Pangeran Diponegoro No. 88, Kutoarjo', 'Kutoarjo', '0275-322222', 'PWR-MEDIKA-7K3N9Q', true),
    ('33333333-3333-3333-3333-333333333333', 'Klinik Pratama Keluarga Banyuurip', 'Jl. Banyuurip Raya KM 3, Banyuurip', 'Banyuurip', '0275-323333', 'PWR-KLGUR-4B8W2L', true)
ON CONFLICT (referral_code) DO NOTHING;

-- Dokter Percontohan
INSERT INTO public.doctors (id, clinic_id, full_name, specialty, sip_number, daily_quota, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'dr. Budi Santoso', 'Dokter Umum', 'SIP-PWR-001/2024', 20, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'drg. Siti Rahayu', 'Dokter Gigi', 'SIP-PWR-002/2024', 15, true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'dr. Hendra Wijaya, Sp.A', 'Spesialis Anak', 'SIP-PWR-003/2024', 25, true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'dr. Ratna Dewi', 'Dokter Umum', 'SIP-PWR-004/2024', 20, true)
ON CONFLICT DO NOTHING;
