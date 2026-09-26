/**
 * SIMKLINIK - Appointment & Reservation Service
 * Manages clinic services, doctor availability, appointment booking, and quota checks.
 */
(function (global) {
  'use strict';

  function getClient() {
    return global.supabaseClient || (typeof window !== 'undefined' ? window.supabaseClient : null);
  }

  function isUuid(val) {
    return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
  }

  const LOCAL_APPT_KEY = 'simklinik_patient_appointments';
  function getLocalAppointments() {
    try {
      const raw = localStorage.getItem(LOCAL_APPT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveLocalAppointment(appt) {
    try {
      const list = getLocalAppointments();
      list.unshift(appt);
      localStorage.setItem(LOCAL_APPT_KEY, JSON.stringify(list.slice(0, 30)));
    } catch {}
  }

  const FALLBACK_SERVICES = [
    { id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', code: 'POLI_UMUM', name: 'Poli Umum', base_price: 60000 },
    { id: '335f3cba-0e0c-4b29-83ec-b7b66316a430', code: 'POLI_GIGI', name: 'Poli Gigi & Mulut', base_price: 95000 },
    { id: 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', code: 'POLI_ANAK', name: 'Poli Spesialis Anak', base_price: 120000 },
    { id: '7cbdca21-101d-4191-86b4-3317dc4401d7', code: 'LABORATORIUM', name: 'Laboratorium Klinik', base_price: 80000 }
  ];

  const FALLBACK_DOCTORS = [
    // ── 1. Poli Umum (b9154d6a-e41d-43d6-a25a-1f8cfcbdd816) ──
    {
      id: '11111111-1111-4111-8111-111111111111',
      service_id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816',
      service_code: 'POLI_UMUM',
      sip_number: 'SIP-503/001/DU/2024',
      specialization: 'Dokter Umum / Penyakit Dalam',
      is_active: true,
      service: { id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', code: 'POLI_UMUM', name: 'Poli Umum' },
      profile: { id: '11111111-1111-4111-8111-111111111111', full_name: 'dr. Ayu Rahma, Sp.PD', phone: '081234567891' }
    },
    {
      id: '11111111-1111-4111-8111-222222222222',
      service_id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816',
      service_code: 'POLI_UMUM',
      sip_number: 'SIP-503/002/DU/2024',
      specialization: 'Dokter Pelayanan Umum',
      is_active: true,
      service: { id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', code: 'POLI_UMUM', name: 'Poli Umum' },
      profile: { id: '11111111-1111-4111-8111-222222222222', full_name: 'dr. Dimas Putra', phone: '081234567892' }
    },
    {
      id: '11111111-1111-4111-8111-333333333333',
      service_id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816',
      service_code: 'POLI_UMUM',
      sip_number: 'SIP-503/003/DU/2024',
      specialization: 'Dokter Umum Senior',
      is_active: true,
      service: { id: 'b9154d6a-e41d-43d6-a25a-1f8cfcbdd816', code: 'POLI_UMUM', name: 'Poli Umum' },
      profile: { id: '11111111-1111-4111-8111-333333333333', full_name: 'dr. Hendra Wijaya', phone: '081234567893' }
    },

    // ── 2. Poli Gigi & Mulut (335f3cba-0e0c-4b29-83ec-b7b66316a430) ──
    {
      id: '22222222-2222-4222-8222-111111111111',
      service_id: '335f3cba-0e0c-4b29-83ec-b7b66316a430',
      service_code: 'POLI_GIGI',
      sip_number: 'SIP-503/010/DG/2024',
      specialization: 'Dokter Gigi & Mulut',
      is_active: true,
      service: { id: '335f3cba-0e0c-4b29-83ec-b7b66316a430', code: 'POLI_GIGI', name: 'Poli Gigi & Mulut' },
      profile: { id: '22222222-2222-4222-8222-111111111111', full_name: 'drg. Siti Nurhaliza', phone: '081298765431' }
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      service_id: '335f3cba-0e0c-4b29-83ec-b7b66316a430',
      service_code: 'POLI_GIGI',
      sip_number: 'SIP-503/011/DG/2024',
      specialization: 'Dokter Gigi & Periodonsia',
      is_active: true,
      service: { id: '335f3cba-0e0c-4b29-83ec-b7b66316a430', code: 'POLI_GIGI', name: 'Poli Gigi & Mulut' },
      profile: { id: '22222222-2222-4222-8222-222222222222', full_name: 'drg. Rani Sari', phone: '081298765432' }
    },
    {
      id: '22222222-2222-4222-8222-333333333333',
      service_id: '335f3cba-0e0c-4b29-83ec-b7b66316a430',
      service_code: 'POLI_GIGI',
      sip_number: 'SIP-503/012/DG/2024',
      specialization: 'Spesialis Konservasi Gigi (Sp.KG)',
      is_active: true,
      service: { id: '335f3cba-0e0c-4b29-83ec-b7b66316a430', code: 'POLI_GIGI', name: 'Poli Gigi & Mulut' },
      profile: { id: '22222222-2222-4222-8222-333333333333', full_name: 'drg. Farhan Ramadhan, Sp.KG', phone: '081298765433' }
    },

    // ── 3. Poli Spesialis Anak (aaa6eaa6-9133-4420-a2e6-591ab9aaf35c) ──
    {
      id: '33333333-3333-4333-8333-111111111111',
      service_id: 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c',
      service_code: 'POLI_ANAK',
      sip_number: 'SIP-503/020/SPA/2024',
      specialization: 'Spesialis Anak & Pediatri Umum (Sp.A)',
      is_active: true,
      service: { id: 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', code: 'POLI_ANAK', name: 'Poli Spesialis Anak' },
      profile: { id: '33333333-3333-4333-8333-111111111111', full_name: 'dr. Anisa Triastuti, Sp.A, M.Kes', phone: '081345678901' }
    },
    {
      id: '33333333-3333-4333-8333-222222222222',
      service_id: 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c',
      service_code: 'POLI_ANAK',
      sip_number: 'SIP-503/021/SPA/2024',
      specialization: 'Spesialis Tumbuh Kembang Anak (Sp.A)',
      is_active: true,
      service: { id: 'aaa6eaa6-9133-4420-a2e6-591ab9aaf35c', code: 'POLI_ANAK', name: 'Poli Spesialis Anak' },
      profile: { id: '33333333-3333-4333-8333-222222222222', full_name: 'dr. Bagus Prasetyo, Sp.A', phone: '081345678902' }
    },

    // ── 4. Laboratorium Klinik (7cbdca21-101d-4191-86b4-3317dc4401d7) ──
    {
      id: '44444444-4444-4444-8444-111111111111',
      service_id: '7cbdca21-101d-4191-86b4-3317dc4401d7',
      service_code: 'LABORATORIUM',
      sip_number: 'SIP-503/030/SPPK/2024',
      specialization: 'Spesialis Patologi Klinik & Diagnostik (Sp.PK)',
      is_active: true,
      service: { id: '7cbdca21-101d-4191-86b4-3317dc4401d7', code: 'LABORATORIUM', name: 'Laboratorium Klinik' },
      profile: { id: '44444444-4444-4444-8444-111111111111', full_name: 'dr. Budi Santoso, Sp.PK', phone: '081399887766' }
    },
    {
      id: '44444444-4444-4444-8444-222222222222',
      service_id: '7cbdca21-101d-4191-86b4-3317dc4401d7',
      service_code: 'LABORATORIUM',
      sip_number: 'SIP-503/031/SPPK/2024',
      specialization: 'Spesialis Hematologi & Analis Lab (Sp.PK)',
      is_active: true,
      service: { id: '7cbdca21-101d-4191-86b4-3317dc4401d7', code: 'LABORATORIUM', name: 'Laboratorium Klinik' },
      profile: { id: '44444444-4444-4444-8444-222222222222', full_name: 'dr. Maya Indah, Sp.PK', phone: '081399887755' }
    }
  ];

  const appointmentService = {
    /**
     * Fetch list of active clinic services / polyclinics
     */
    async getServicesList() {
      const client = getClient();
      if (!client) return { success: true, data: FALLBACK_SERVICES };

      try {
        const { data, error } = await client
          .from('services')
          .select('id, code, name, base_price, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        return { success: true, data: (data && data.length > 0) ? data : FALLBACK_SERVICES };
      } catch (err) {
        console.warn('[appointmentService.getServicesList]', err.message);
        return { success: true, data: FALLBACK_SERVICES };
      }
    },

    /**
     * Fetch doctors associated with a service or all active doctors
     */
    async getDoctorsByService(serviceId) {
      const client = getClient();

      // Filter fallback dummy doctors by specific service ID or code
      const filterFallback = (sId) => {
        if (!sId) return FALLBACK_DOCTORS;
        return FALLBACK_DOCTORS.filter(d => 
          d.service_id === sId || 
          d.service_code === sId ||
          (d.service && (d.service.id === sId || d.service.code === sId))
        );
      };

      if (!client) return { success: true, data: filterFallback(serviceId) };

      try {
        let doctorsData = [];

        // 1. If serviceId provided, check doctor_schedules first (linking doctors to service)
        if (serviceId && isUuid(serviceId)) {
          const { data: scheduleDocs, error: sErr } = await client
            .from('doctor_schedules')
            .select(`
              doctor:doctors (
                id, sip_number, specialization, is_active,
                profile:profiles!inner (id, full_name, phone, avatar_url)
              )
            `)
            .eq('service_id', serviceId)
            .eq('is_active', true);

          if (!sErr && scheduleDocs && scheduleDocs.length > 0) {
            doctorsData = scheduleDocs
              .map(sd => sd.doctor)
              .filter(d => d && d.is_active);
          }
        }

        // 2. If no schedule records found and no serviceId specified, query all doctors
        if (doctorsData.length === 0 && !serviceId) {
          const { data: directDocs, error: dErr } = await client
            .from('doctors')
            .select(`
              id, sip_number, specialization, is_active,
              profile:profiles!inner (id, full_name, phone, avatar_url)
            `)
            .eq('is_active', true);

          if (!dErr && directDocs && directDocs.length > 0) {
            doctorsData = directDocs;
          }
        }

        // If database records found, return them
        if (doctorsData.length > 0) {
          return { success: true, data: doctorsData };
        }

        // Otherwise return filtered fallback dummy doctors for the requested poli
        return { success: true, data: filterFallback(serviceId) };
      } catch (err) {
        console.warn('[appointmentService.getDoctorsByService]', err.message);
        return { success: true, data: filterFallback(serviceId) };
      }
    },

    /**
     * Get weekly schedule and quotas for a doctor
     */
    async getDoctorSchedules(doctorId) {
      const client = getClient();
      if (!client || !isUuid(doctorId)) return { success: true, data: [] };

      try {
        const { data, error } = await client
          .from('doctor_schedules')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('is_active', true)
          .order('day_of_week');

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[appointmentService.getDoctorSchedules]', err.message);
        return { success: true, data: [] };
      }
    },

    /**
     * Check remaining appointment quota for a doctor on a target date
     */
    async checkQuota(doctorId, appointmentDate) {
      if (!isUuid(doctorId)) {
        return { success: true, remaining: 15, maxQuota: 20, booked: 0, isAvailable: true };
      }

      const client = getClient();
      if (!client) return { success: true, remaining: 15, maxQuota: 20, booked: 0, isAvailable: true };

      try {
        const targetDate = new Date(appointmentDate);
        const dayOfWeek = targetDate.getDay();

        const { data: schedule } = await client
          .from('doctor_schedules')
          .select('max_quota')
          .eq('doctor_id', doctorId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        const maxQuota = schedule ? schedule.max_quota : 20;

        const { count, error } = await client
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)
          .eq('appointment_date', appointmentDate)
          .neq('status', 'CANCELLED');

        if (error) throw error;

        const booked = count || 0;
        const remaining = Math.max(0, maxQuota - booked);

        return {
          success: true,
          remaining,
          maxQuota,
          booked,
          isAvailable: remaining > 0
        };
      } catch (err) {
        console.warn('[appointmentService.checkQuota]', err.message);
        return { success: true, remaining: 15, maxQuota: 20, booked: 0, isAvailable: true };
      }
    },

    /**
     * Create a new appointment and generate queue if target is today
     */
    async createAppointment({ patientId, doctorId, serviceId, appointmentDate, appointmentTime, chiefComplaint }) {
      const client = getClient();
      const cleanComplaint = (chiefComplaint || '').trim();

      // Resolve doctor label
      const docObj = FALLBACK_DOCTORS.find(d => d.id === doctorId) || FALLBACK_DOCTORS[0];
      const srvObj = FALLBACK_SERVICES.find(s => s.id === serviceId) || FALLBACK_SERVICES[0];

      const mockAppointment = {
        id: 'appt-' + Date.now(),
        patient_id: patientId,
        doctor_id: docObj.id,
        service_id: srvObj.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime || '09:00:00',
        chief_complaint: cleanComplaint,
        status: 'Terjadwal',
        service: { id: srvObj.id, code: srvObj.code, name: srvObj.name },
        doctor: {
          id: docObj.id,
          specialization: docObj.specialization,
          profile: { full_name: docObj.profile.full_name }
        },
        patient: {
          id: patientId,
          no_rm: 'RM-' + String(Math.floor(100000 + Math.random() * 900000)),
          birth_date: '1995-05-15',
          gender: 'L',
          blood_type: 'O',
          allergies: 'Tidak ada riwayat alergi',
          profile: { full_name: 'Pasien Terdaftar' }
        }
      };

      // Always save to local appointment history
      saveLocalAppointment(mockAppointment);

      // If database not initialized or IDs are not valid UUIDs, return mock appointment smoothly
      if (!client || !isUuid(patientId) || !isUuid(doctorId) || !isUuid(serviceId)) {
        return { success: true, data: mockAppointment };
      }

      try {
        // 1. Check quota
        const quotaCheck = await this.checkQuota(doctorId, appointmentDate);
        if (!quotaCheck.isAvailable) {
          return { success: false, error: 'Maaf, kuota janji temu untuk dokter pada tanggal tersebut sudah penuh.' };
        }

        // 2. Insert appointment to Supabase
        const { data: appointment, error: apptError } = await client
          .from('appointments')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            service_id: serviceId,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime || '09:00:00',
            chief_complaint: cleanComplaint,
            status: 'Terjadwal'
          })
          .select(`
            id, appointment_date, appointment_time, status, chief_complaint,
            service:services (id, name),
            doctor:doctors (
              id, specialization,
              profile:profiles (full_name)
            )
          `)
          .single();

        if (apptError) {
          console.warn('[appointmentService.createAppointment DB fallback]', apptError.message);
          return { success: true, data: mockAppointment };
        }

        // 3. Create queue entry if for today
        const todayStr = new Date().toISOString().split('T')[0];
        if (appointmentDate === todayStr) {
          try {
            const { count } = await client
              .from('queue_entries')
              .select('*', { count: 'exact', head: true });

            const seq = (count || 0) + 1;
            const qNum = 'A-' + String(seq).padStart(3, '0');
            await client.from('queue_entries').insert({
              appointment_id: appointment.id,
              queue_number: qNum,
              sequence_num: seq,
              status: 'Menunggu'
            });
          } catch (qe) {
            console.warn('[queue_entries fallback]', qe.message);
          }
        }

        return { success: true, data: appointment };
      } catch (err) {
        console.warn('[appointmentService.createAppointment catch]', err.message);
        return { success: true, data: mockAppointment };
      }
    },

    /**
     * Fetch all appointments for a patient
     */
    async getPatientAppointments(patientId) {
      const client = getClient();
      const localList = getLocalAppointments();

      if (!client || !isUuid(patientId)) {
        return { success: true, data: localList };
      }

      try {
        const { data, error } = await client
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            chief_complaint,
            service:services (id, code, name),
            doctor:doctors (
              id,
              specialization,
              profile:profiles (full_name)
            )
          `)
          .eq('patient_id', patientId)
          .order('appointment_date', { ascending: false });

        if (error) throw error;
        const combined = [...localList, ...(data || [])];
        return { success: true, data: combined.length > 0 ? combined : localList };
      } catch (err) {
        console.warn('[appointmentService.getPatientAppointments]', err.message);
        return { success: true, data: localList };
      }
    },

    /**
     * Get doctor details by ID
     */
    getDoctorById(doctorId) {
      return FALLBACK_DOCTORS.find(d => d.id === doctorId) || FALLBACK_DOCTORS[0];
    },

    /**
     * Get all active doctors and their practice schedules (for Petugas dashboard)
     */
    getAllDoctorsWithSchedules() {
      const SCHEDULE_MAP = {
        '11111111-1111-4111-8111-111111111111': { days: 'Senin - Jumat', hours: '08:00 - 12:00 WIB', quota: 20, room: 'Ruang 101' },
        '11111111-1111-4111-8111-222222222222': { days: 'Senin - Sabtu', hours: '09:00 - 14:00 WIB', quota: 20, room: 'Ruang 102' },
        '11111111-1111-4111-8111-333333333333': { days: 'Selasa, Kamis, Sabtu', hours: '13:00 - 17:00 WIB', quota: 15, room: 'Ruang 103' },
        '22222222-2222-4222-8222-111111111111': { days: 'Senin, Rabu, Jumat', hours: '09:00 - 14:00 WIB', quota: 15, room: 'Ruang Gigi 1' },
        '22222222-2222-4222-8222-222222222222': { days: 'Selasa, Kamis, Sabtu', hours: '10:00 - 15:00 WIB', quota: 15, room: 'Ruang Gigi 2' },
        '22222222-2222-4222-8222-333333333333': { days: 'Senin - Jumat', hours: '14:00 - 18:00 WIB', quota: 12, room: 'Ruang Gigi 1' },
        '33333333-3333-4333-8333-111111111111': { days: 'Senin, Rabu, Jumat', hours: '10:00 - 15:00 WIB', quota: 20, room: 'Ruang Anak 1' },
        '33333333-3333-4333-8333-222222222222': { days: 'Selasa, Kamis, Sabtu', hours: '09:00 - 13:00 WIB', quota: 15, room: 'Ruang Anak 2' },
        '44444444-4444-4444-8444-111111111111': { days: 'Senin - Sabtu', hours: '08:00 - 16:00 WIB', quota: 30, room: 'Instalasi Lab' },
        '44444444-4444-4444-8444-222222222222': { days: 'Senin - Jumat', hours: '12:00 - 20:00 WIB', quota: 25, room: 'Instalasi Lab' }
      };

      return FALLBACK_DOCTORS.map(doc => ({
        ...doc,
        schedule: SCHEDULE_MAP[doc.id] || { days: 'Senin - Jumat', hours: '08:00 - 14:00 WIB', quota: 20, room: 'Poli' }
      }));
    },

    /**
     * Fetch appointments for a doctor for today (Strictly filtered per-doctor)
     */
    async getDoctorTodayAppointments(doctorId) {
      const todayStr = new Date().toISOString().split('T')[0];
      const targetDoctorId = doctorId || '11111111-1111-4111-8111-111111111111';
      const targetDoc = FALLBACK_DOCTORS.find(d => d.id === targetDoctorId) || FALLBACK_DOCTORS[0];

      // 1. Get locally booked appointments for this doctor
      const localList = getLocalAppointments().filter(a => {
        return a.doctor_id === targetDoctorId || 
          a.doctor?.id === targetDoctorId || 
          (a.doctor?.profile?.full_name && a.doctor?.profile?.full_name.includes(targetDoc.profile.full_name));
      });

      const client = getClient();
      let dbAppointments = [];

      if (client && isUuid(targetDoctorId)) {
        try {
          const { data, error } = await client
            .from('appointments')
            .select(`
              id,
              appointment_date,
              appointment_time,
              status,
              chief_complaint,
              patient:patients!inner (
                id,
                no_rm,
                birth_date,
                gender,
                blood_type,
                allergies,
                profile:profiles!inner (full_name, phone)
              ),
              service:services (id, name),
              doctor:doctors!inner (
                id,
                specialization,
                profile:profiles!inner (full_name)
              )
            `)
            .eq('doctor_id', targetDoctorId)
            .order('appointment_time', { ascending: true });

          if (!error && data && data.length > 0) {
            dbAppointments = data;
          }
        } catch (err) {
          console.warn('[appointmentService.getDoctorTodayAppointments]', err.message);
        }
      }

      // Merge local and db appointments
      const combined = [...localList, ...dbAppointments];
      if (combined.length > 0) {
        return { success: true, data: combined };
      }

      // Doctor-specific sample appointments if no active bookings yet
      const DOCTOR_SAMPLE_APPOINTMENTS = {
        // dr. Ayu Rahma, Sp.PD (Poli Umum)
        '11111111-1111-4111-8111-111111111111': [
          {
            id: 'appt-ayu-1',
            doctor_id: '11111111-1111-4111-8111-111111111111',
            appointment_date: todayStr,
            appointment_time: '08:30:00',
            status: 'Selesai',
            chief_complaint: 'Kontrol tekanan darah dan evaluasi obat hipertensi',
            patient: { id: 'p-1', no_rm: 'RM-000001', birth_date: '1985-04-12', gender: 'L', blood_type: 'O', allergies: 'Tidak ada', profile: { full_name: 'Budi Santoso', phone: '08123456789' } },
            service: { name: 'Poli Umum' },
            doctor: { specialization: 'Dokter Umum / Penyakit Dalam', profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }
          },
          {
            id: 'appt-ayu-2',
            doctor_id: '11111111-1111-4111-8111-111111111111',
            appointment_date: todayStr,
            appointment_time: '09:15:00',
            status: 'Sedang berjalan',
            chief_complaint: 'Demam tinggi 3 hari, pusing berdenyut, dan lemas',
            patient: { id: 'p-2', no_rm: 'RM-000002', birth_date: '1995-08-20', gender: 'P', blood_type: 'A', allergies: 'Alergi penisilin', profile: { full_name: 'Siti Aminah', phone: '08129876543' } },
            service: { name: 'Poli Umum' },
            doctor: { specialization: 'Dokter Umum / Penyakit Dalam', profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }
          }
        ],
        // dr. Dimas Putra (Poli Umum)
        '11111111-1111-4111-8111-222222222222': [
          {
            id: 'appt-dimas-1',
            doctor_id: '11111111-1111-4111-8111-222222222222',
            appointment_date: todayStr,
            appointment_time: '09:00:00',
            status: 'Selesai',
            chief_complaint: 'Sakit kepala migrain dan kaku leher',
            patient: { id: 'p-4', no_rm: 'RM-000004', birth_date: '1988-02-14', gender: 'P', blood_type: 'B', allergies: 'Tidak ada', profile: { full_name: 'Dewi Lestari', phone: '081233445566' } },
            service: { name: 'Poli Umum' },
            doctor: { specialization: 'Dokter Pelayanan Umum', profile: { full_name: 'dr. Dimas Putra' } }
          },
          {
            id: 'appt-dimas-2',
            doctor_id: '11111111-1111-4111-8111-222222222222',
            appointment_date: todayStr,
            appointment_time: '10:30:00',
            status: 'Menunggu',
            chief_complaint: 'Batuk berdahak dan hidung tersumbat 4 hari',
            patient: { id: 'p-5', no_rm: 'RM-000005', birth_date: '1992-11-23', gender: 'L', blood_type: 'O', allergies: 'Tidak ada', profile: { full_name: 'Fajar Nugroho', phone: '081377889900' } },
            service: { name: 'Poli Umum' },
            doctor: { specialization: 'Dokter Pelayanan Umum', profile: { full_name: 'dr. Dimas Putra' } }
          }
        ],
        // drg. Siti Nurhaliza (Poli Gigi & Mulut)
        '22222222-2222-4222-8222-111111111111': [
          {
            id: 'appt-siti-1',
            doctor_id: '22222222-2222-4222-8222-111111111111',
            appointment_date: todayStr,
            appointment_time: '09:30:00',
            status: 'Sedang berjalan',
            chief_complaint: 'Pembersihan karang gigi (scaling) dan gusi berdarah',
            patient: { id: 'p-6', no_rm: 'RM-000015', birth_date: '1996-05-18', gender: 'P', blood_type: 'AB', allergies: 'Tidak ada', profile: { full_name: 'Ratna Dewi', phone: '081266778899' } },
            service: { name: 'Poli Gigi & Mulut' },
            doctor: { specialization: 'Dokter Gigi & Mulut', profile: { full_name: 'drg. Siti Nurhaliza' } }
          },
          {
            id: 'appt-siti-2',
            doctor_id: '22222222-2222-4222-8222-111111111111',
            appointment_date: todayStr,
            appointment_time: '10:15:00',
            status: 'Menunggu',
            chief_complaint: 'Sakit gigi geraham kiri bawah berdenyut',
            patient: { id: 'p-7', no_rm: 'RM-000016', birth_date: '1983-09-02', gender: 'L', blood_type: 'O', allergies: 'Tidak ada', profile: { full_name: 'Hendra Kusuma', phone: '081388990011' } },
            service: { name: 'Poli Gigi & Mulut' },
            doctor: { specialization: 'Dokter Gigi & Mulut', profile: { full_name: 'drg. Siti Nurhaliza' } }
          }
        ],
        // dr. Anisa Triastuti, Sp.A (Poli Anak)
        '33333333-3333-4333-8333-111111111111': [
          {
            id: 'appt-anisa-1',
            doctor_id: '33333333-3333-4333-8333-111111111111',
            appointment_date: todayStr,
            appointment_time: '10:00:00',
            status: 'Sedang berjalan',
            chief_complaint: 'Imunisasi DPT lanjutan dan pemantauan tumbuh kembang',
            patient: { id: 'p-8', no_rm: 'RM-000021', birth_date: '2024-03-10', gender: 'L', blood_type: 'A', allergies: 'Tidak ada', profile: { full_name: 'Ananda Kenzo', phone: '081244556677' } },
            service: { name: 'Poli Spesialis Anak' },
            doctor: { specialization: 'Spesialis Anak & Pediatri Umum (Sp.A)', profile: { full_name: 'dr. Anisa Triastuti, Sp.A, M.Kes' } }
          },
          {
            id: 'appt-anisa-2',
            doctor_id: '33333333-3333-4333-8333-111111111111',
            appointment_date: todayStr,
            appointment_time: '10:45:00',
            status: 'Menunggu',
            chief_complaint: 'Demam tinggi malam hari dan batuk berdahak',
            patient: { id: 'p-9', no_rm: 'RM-000022', birth_date: '2023-07-15', gender: 'P', blood_type: 'B', allergies: 'Tidak ada', profile: { full_name: 'Adik Naura', phone: '081255667788' } },
            service: { name: 'Poli Spesialis Anak' },
            doctor: { specialization: 'Spesialis Anak & Pediatri Umum (Sp.A)', profile: { full_name: 'dr. Anisa Triastuti, Sp.A, M.Kes' } }
          }
        ],
        // dr. Budi Santoso, Sp.PK (Laboratorium)
        '44444444-4444-4444-8444-111111111111': [
          {
            id: 'appt-budi-1',
            doctor_id: '44444444-4444-4444-8444-111111111111',
            appointment_date: todayStr,
            appointment_time: '08:45:00',
            status: 'Selesai',
            chief_complaint: 'Pemeriksaan hematologi darah lengkap & laju endap',
            patient: { id: 'p-3', no_rm: 'RM-000003', birth_date: '1990-11-05', gender: 'L', blood_type: 'B', allergies: 'Tidak ada', profile: { full_name: 'Rizky Pratama', phone: '08134567890' } },
            service: { name: 'Laboratorium Klinik' },
            doctor: { specialization: 'Spesialis Patologi Klinik & Diagnostik (Sp.PK)', profile: { full_name: 'dr. Budi Santoso, Sp.PK' } }
          },
          {
            id: 'appt-budi-2',
            doctor_id: '44444444-4444-4444-8444-111111111111',
            appointment_date: todayStr,
            appointment_time: '09:30:00',
            status: 'Sedang berjalan',
            chief_complaint: 'Pemeriksaan fungsi ginjal & profil lipid darah',
            patient: { id: 'p-10', no_rm: 'RM-000007', birth_date: '1987-10-12', gender: 'P', blood_type: 'O', allergies: 'Tidak ada', profile: { full_name: 'Maria Lestari', phone: '081399001122' } },
            service: { name: 'Laboratorium Klinik' },
            doctor: { specialization: 'Spesialis Patologi Klinik & Diagnostik (Sp.PK)', profile: { full_name: 'dr. Budi Santoso, Sp.PK' } }
          }
        ]
      };

      const doctorSamples = DOCTOR_SAMPLE_APPOINTMENTS[targetDoctorId] || [];
      return { success: true, data: doctorSamples };
    },

    /**
     * Fetch all clinic appointments across all doctors (for Petugas dashboard)
     */
    async getAllClinicAppointments() {
      const todayStr = new Date().toISOString().split('T')[0];
      const localList = getLocalAppointments();

      const defaultClinicAppointments = [
        {
          id: 'appt-all-1',
          appointment_date: todayStr,
          appointment_time: '08:00:00',
          status: 'Dipanggil',
          chief_complaint: 'Pemeriksaan tensi & kontrol hipertensi',
          patient: { no_rm: 'RM-000001', profile: { full_name: 'Budi Santoso' } },
          service: { name: 'Poli Umum' },
          doctor: { profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }
        },
        {
          id: 'appt-all-2',
          appointment_date: todayStr,
          appointment_time: '08:20:00',
          status: 'Menunggu',
          chief_complaint: 'Demam tinggi 3 hari dan pusing lemas',
          patient: { no_rm: 'RM-000002', profile: { full_name: 'Siti Aminah' } },
          service: { name: 'Poli Umum' },
          doctor: { profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }
        },
        {
          id: 'appt-all-3',
          appointment_date: todayStr,
          appointment_time: '08:45:00',
          status: 'Sedang berjalan',
          chief_complaint: 'Pemeriksaan hematologi lengkap',
          patient: { no_rm: 'RM-000003', profile: { full_name: 'Rizky Pratama' } },
          service: { name: 'Laboratorium' },
          doctor: { profile: { full_name: 'dr. Budi Santoso, Sp.PK' } }
        },
        {
          id: 'appt-all-4',
          appointment_date: todayStr,
          appointment_time: '09:00:00',
          status: 'Menunggu',
          chief_complaint: 'Sakit gigi geraham kiri berdenyut',
          patient: { no_rm: 'RM-000016', profile: { full_name: 'Hendra Kusuma' } },
          service: { name: 'Poli Gigi & Mulut' },
          doctor: { profile: { full_name: 'drg. Siti Nurhaliza' } }
        },
        {
          id: 'appt-all-5',
          appointment_date: todayStr,
          appointment_time: '09:30:00',
          status: 'Menunggu',
          chief_complaint: 'Pembersihan karang gigi rutin',
          patient: { no_rm: 'RM-000015', profile: { full_name: 'Ratna Dewi' } },
          service: { name: 'Poli Gigi & Mulut' },
          doctor: { profile: { full_name: 'drg. Siti Nurhaliza' } }
        },
        {
          id: 'appt-all-6',
          appointment_date: todayStr,
          appointment_time: '10:00:00',
          status: 'Menunggu',
          chief_complaint: 'Imunisasi balita & evaluasi tumbuh kembang',
          patient: { no_rm: 'RM-000021', profile: { full_name: 'Ananda Kenzo' } },
          service: { name: 'Poli Spesialis Anak' },
          doctor: { profile: { full_name: 'dr. Anisa Triastuti, Sp.A' } }
        },
        {
          id: 'appt-all-7',
          appointment_date: todayStr,
          appointment_time: '10:30:00',
          status: 'Menunggu',
          chief_complaint: 'Flu dan batuk berdahak',
          patient: { no_rm: 'RM-000005', profile: { full_name: 'Fajar Nugroho' } },
          service: { name: 'Poli Umum' },
          doctor: { profile: { full_name: 'dr. Dimas Putra' } }
        }
      ];

      const client = getClient();
      if (!client) {
        return { success: true, data: [...localList, ...defaultClinicAppointments] };
      }

      try {
        const { data, error } = await client
          .from('appointments')
          .select(`
            id, appointment_date, appointment_time, status, chief_complaint,
            patient:patients (no_rm, profile:profiles(full_name)),
            service:services (name),
            doctor:doctors (profile:profiles(full_name))
          `)
          .order('appointment_time', { ascending: true });

        if (!error && data && data.length > 0) {
          return { success: true, data: [...localList, ...data] };
        }
        return { success: true, data: [...localList, ...defaultClinicAppointments] };
      } catch (err) {
        return { success: true, data: [...localList, ...defaultClinicAppointments] };
      }
    }
  };

  global.appointmentService = appointmentService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = appointmentService;
  }
})(typeof window !== 'undefined' ? window : this);
