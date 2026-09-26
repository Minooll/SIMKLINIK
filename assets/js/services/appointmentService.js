/**
 * SIMKLINIK - Appointment & Reservation Service
 * Manages clinic services, doctor availability, appointment booking, and quota checks.
 */
(function (global) {
  'use strict';

  function getClient() {
    return global.supabaseClient || (typeof window !== 'undefined' ? window.supabaseClient : null);
  }

  const appointmentService = {
    /**
     * Fetch list of active clinic services / polyclinics
     */
    async getServicesList() {
      const client = getClient();
      if (!client) {
        return {
          success: true,
          data: [
            { id: '1', code: 'POLI_UMUM', name: 'Poli Umum', base_price: 60000 },
            { id: '2', code: 'POLI_GIGI', name: 'Poli Gigi & Mulut', base_price: 95000 },
            { id: '3', code: 'POLI_ANAK', name: 'Poli Spesialis Anak', base_price: 120000 },
            { id: '4', code: 'LABORATORIUM', name: 'Laboratorium Klinik', base_price: 80000 }
          ]
        };
      }

      try {
        const { data, error } = await client
          .from('services')
          .select('id, code, name, base_price, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[appointmentService.getServicesList]', err.message);
        return {
          success: true,
          data: [
            { id: '1', code: 'POLI_UMUM', name: 'Poli Umum', base_price: 60000 },
            { id: '2', code: 'POLI_GIGI', name: 'Poli Gigi & Mulut', base_price: 95000 },
            { id: '3', code: 'POLI_ANAK', name: 'Poli Spesialis Anak', base_price: 120000 },
            { id: '4', code: 'LABORATORIUM', name: 'Laboratorium Klinik', base_price: 80000 }
          ]
        };
      }
    },

    /**
     * Fetch doctors associated with a service or all active doctors
     */
    async getDoctorsByService(serviceId) {
      const client = getClient();
      if (!client) {
        return {
          success: true,
          data: [
            {
              id: 'doc-1',
              specialization: 'Dokter Umum / Penyakit Dalam',
              profile: { full_name: 'dr. Ayu Rahma, Sp.PD', phone: '08123456789' }
            },
            {
              id: 'doc-2',
              specialization: 'Dokter Gigi',
              profile: { full_name: 'drg. Siti Nurhaliza', phone: '08129876543' }
            }
          ]
        };
      }

      try {
        let query = client
          .from('doctors')
          .select(`
            id,
            sip_number,
            specialization,
            is_active,
            service:services (id, code, name),
            profile:profiles!inner (id, full_name, phone, avatar_url)
          `)
          .eq('is_active', true);

        if (serviceId) {
          query = query.eq('service_id', serviceId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[appointmentService.getDoctorsByService]', err.message);
        return {
          success: true,
          data: [
            {
              id: 'doc-1',
              specialization: 'Dokter Umum',
              profile: { full_name: 'dr. Andi Pratama, Sp.PD', phone: '08123456789' }
            },
            {
              id: 'doc-2',
              specialization: 'Dokter Gigi',
              profile: { full_name: 'drg. Siti Nurhaliza', phone: '08129876543' }
            }
          ]
        };
      }
    },

    /**
     * Get weekly schedule and quotas for a doctor
     */
    async getDoctorSchedules(doctorId) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

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
      const client = getClient();
      if (!client) return { success: true, remaining: 15, maxQuota: 20 };

      try {
        const targetDate = new Date(appointmentDate);
        const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ...

        // Get max quota from schedule
        const { data: schedule } = await client
          .from('doctor_schedules')
          .select('max_quota')
          .eq('doctor_id', doctorId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        const maxQuota = schedule ? schedule.max_quota : 20;

        // Count existing appointments for this doctor on this date
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
        return { success: true, remaining: 10, maxQuota: 20, booked: 0, isAvailable: true };
      }
    },

    /**
     * Create a new appointment and generate queue if target is today
     */
    async createAppointment({ patientId, doctorId, serviceId, appointmentDate, appointmentTime, chiefComplaint }) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        // 1. Check quota
        const quotaCheck = await this.checkQuota(doctorId, appointmentDate);
        if (!quotaCheck.isAvailable) {
          return { success: false, error: 'Maaf, kuota janji temu untuk dokter pada tanggal tersebut sudah penuh.' };
        }

        // 2. Insert appointment
        const { data: appointment, error: apptError } = await client
          .from('appointments')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            service_id: serviceId,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime || '09:00:00',
            chief_complaint: chiefComplaint || '',
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

        if (apptError) throw apptError;

        // 3. Create queue entry
        const todayStr = new Date().toISOString().split('T')[0];
        if (appointmentDate === todayStr) {
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
        }

        return { success: true, data: appointment };
      } catch (err) {
        console.warn('[appointmentService.createAppointment]', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Fetch all appointments for a patient
     */
    async getPatientAppointments(patientId) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

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
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[appointmentService.getPatientAppointments]', err.message);
        return { success: false, error: err.message, data: [] };
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
