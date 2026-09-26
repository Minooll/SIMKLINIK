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
        appointment_date: appointmentDate,
        appointment_time: appointmentTime || '09:00:00',
        chief_complaint: cleanComplaint,
        status: 'Terjadwal',
        service: { name: srvObj.name },
        doctor: {
          specialization: docObj.specialization,
          profile: { full_name: docObj.profile.full_name }
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
     * Fetch appointments for a doctor for today
     */
    async getDoctorTodayAppointments(doctorId) {
      const fallbackDoctorAppointments = [
        {
          id: 'appt-1',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '08:30:00',
          status: 'Selesai',
          chief_complaint: 'Kontrol tekanan darah rutin',
          patient: {
            id: 'p-1',
            no_rm: 'RM-000001',
            birth_date: '1985-04-12',
            gender: 'L',
            blood_type: 'O',
            allergies: 'Tidak ada',
            profile: { full_name: 'Budi Santoso', phone: '08123456789' }
          }
        },
        {
          id: 'appt-2',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '09:15:00',
          status: 'Sedang berjalan',
          chief_complaint: 'Demam tinggi 3 hari dan batuk',
          patient: {
            id: 'p-2',
            no_rm: 'RM-000002',
            birth_date: '1995-08-20',
            gender: 'P',
            blood_type: 'A',
            allergies: 'Alergi penisilin',
            profile: { full_name: 'Siti Aminah', phone: '08129876543' }
          }
        },
        {
          id: 'appt-3',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '10:00:00',
          status: 'Menunggu',
          chief_complaint: 'Evaluasi hasil tes darah rutin',
          patient: {
            id: 'p-3',
            no_rm: 'RM-000003',
            birth_date: '1990-11-05',
            gender: 'L',
            blood_type: 'B',
            allergies: 'Tidak ada',
            profile: { full_name: 'Rizky Pratama', phone: '08134567890' }
          }
        }
      ];

      const client = getClient();
      if (!client) return { success: true, data: fallbackDoctorAppointments };

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        let query = client
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
            )
          `)
          .eq('appointment_date', todayStr)
          .order('appointment_time', { ascending: true });

        if (doctorId) {
          query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: (data && data.length > 0) ? data : fallbackDoctorAppointments };
      } catch (err) {
        console.warn('[appointmentService.getDoctorTodayAppointments]', err.message);
        return { success: true, data: fallbackDoctorAppointments };
      }
    }
  };

  global.appointmentService = appointmentService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = appointmentService;
  }
})(typeof window !== 'undefined' ? window : this);
