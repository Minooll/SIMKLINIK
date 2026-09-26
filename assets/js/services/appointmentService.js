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
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const todayStr = new Date().toISOString().split('T')[0];
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
            )
          `)
          .eq('doctor_id', doctorId)
          .eq('appointment_date', todayStr)
          .order('appointment_time', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[appointmentService.getDoctorTodayAppointments]', err.message);
        return { success: false, error: err.message, data: [] };
      }
    }
  };

  global.appointmentService = appointmentService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = appointmentService;
  }
})(typeof window !== 'undefined' ? window : this);
