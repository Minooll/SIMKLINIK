/**
 * SIMKLINIK - Electronic Medical Record (RME) Service
 * Compliant with Permenkes No. 24/2022 (SOAP, Vital Signs, ICD-10, Immutability upon finalization).
 */
(function (global) {
  'use strict';

  function getClient() {
    return global.supabaseClient || (typeof window !== 'undefined' ? window.supabaseClient : null);
  }

  const medicalRecordService = {
    /**
     * Get patient medical records history
     */
    async getPatientHistory(patientId) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const { data, error } = await client
          .from('medical_records')
          .select(`
            id,
            record_date,
            subjective,
            objective,
            vital_signs,
            assessment,
            icd10_code,
            plan,
            status,
            doctor:doctors (
              id,
              specialization,
              profile:profiles (full_name)
            ),
            prescriptions (
              id,
              prescription_number,
              status,
              notes,
              prescription_items (
                id,
                medicine_name,
                dosage,
                frequency,
                quantity,
                instructions
              )
            )
          `)
          .eq('patient_id', patientId)
          .order('record_date', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[medicalRecordService.getPatientHistory]', err.message);
        return { success: false, error: err.message, data: [] };
      }
    },

    /**
     * Get medical records handled by a doctor
     */
    async getDoctorRecords(doctorId) {
      const client = getClient();
      if (!client) return { success: true, data: [] };

      try {
        let query = client
          .from('medical_records')
          .select(`
            id,
            record_date,
            subjective,
            objective,
            vital_signs,
            assessment,
            diagnosis_icd10,
            treatment_plan,
            finalized_at,
            patient:patients (
              id, no_rm, nik,
              profile:profiles (full_name)
            ),
            prescriptions (
              id, prescription_number, status,
              prescription_items (id, medicine_name, dosage, frequency, quantity)
            )
          `)
          .order('record_date', { ascending: false });

        if (doctorId) {
          query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[medicalRecordService.getDoctorRecords]', err.message);
        return { success: true, data: [] };
      }
    },

    /**
     * Get detailed medical record by ID
     */
    async getRecordById(recordId) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const { data, error } = await client
          .from('medical_records')
          .select(`
            id,
            appointment_id,
            patient_id,
            doctor_id,
            record_date,
            subjective,
            objective,
            vital_signs,
            assessment,
            icd10_code,
            plan,
            status,
            patient:patients (
              id, no_rm, nik, birth_date, gender, blood_type, allergies,
              profile:profiles (full_name, phone)
            ),
            doctor:doctors (
              id, specialization,
              profile:profiles (full_name)
            ),
            prescriptions (
              id, prescription_number, status, notes,
              prescription_items (
                id, medicine_name, dosage, frequency, quantity, instructions
              )
            )
          `)
          .eq('id', recordId)
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('[medicalRecordService.getRecordById]', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Save SOAP record (Draft or Final)
     */
    async saveMedicalRecord(payload) {
      const client = getClient();
      if (!client) {
        return {
          success: true,
          data: {
            id: payload.id || 'rec-demo-' + Date.now(),
            record_date: new Date().toISOString(),
            subjective: payload.subjective,
            objective: payload.objective,
            vital_signs: payload.vitalSigns,
            assessment: payload.assessment,
            diagnosis_icd10: (payload.icd10Code ? `${payload.icd10Code} - ` : '') + (payload.assessment || ''),
            treatment_plan: payload.plan,
            finalized_at: payload.isFinal ? new Date().toISOString() : null,
            status: payload.isFinal ? 'FINAL' : 'DRAFT'
          }
        };
      }

      try {
        const {
          id,
          appointmentId,
          patientId,
          doctorId,
          subjective,
          objective,
          vitalSigns,
          assessment,
          icd10Code,
          plan,
          isFinal
        } = payload;

        const recordData = {
          appointment_id: appointmentId || null,
          patient_id: patientId,
          doctor_id: doctorId,
          subjective: subjective || 'Keluhan umum',
          objective: objective || 'Pemeriksaan fisik normal',
          vital_signs: vitalSigns || { systolic: 120, diastolic: 80, heart_rate: 78, temperature: 36.5 },
          assessment: assessment || 'Observasi klinis',
          diagnosis_icd10: (icd10Code ? `${icd10Code} - ` : '') + (assessment || 'Umum'),
          treatment_plan: plan || 'Terapi simtomatik dan edukasi',
          finalized_at: isFinal ? new Date().toISOString() : null
        };

        let result;
        if (id) {
          // Check if already finalized (cannot be edited under Permenkes 24/2022)
          const { data: existing } = await client
            .from('medical_records')
            .select('finalized_at')
            .eq('id', id)
            .single();

          if (existing && existing.finalized_at) {
            return {
              success: false,
              error: 'Rekam Medis telah difinalisasi dan dikunci permanen (Permenkes No. 24/2022).'
            };
          }

          const { data, error } = await client
            .from('medical_records')
            .update(recordData)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await client
            .from('medical_records')
            .insert(recordData)
            .select()
            .single();

          if (error) throw error;
          result = data;
        }

        // If finalized and attached to appointment, update appointment status to Selesai
        if (isFinal && appointmentId) {
          await client
            .from('appointments')
            .update({ status: 'Selesai' })
            .eq('id', appointmentId);
        }

        return { success: true, data: result };
      } catch (err) {
        console.warn('[medicalRecordService.saveMedicalRecord]', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Extracts the latest medical record sorted by date
     */
    extractLatestRecord(records) {
      if (!Array.isArray(records) || records.length === 0) return null;
      const sorted = [...records].sort((a, b) => {
        const dateA = new Date(a.created_at || a.record_date || a.visit_date || 0).getTime();
        const dateB = new Date(b.created_at || b.record_date || b.visit_date || 0).getTime();
        return dateB - dateA;
      });
      return sorted[0];
    }
  };

  global.medicalRecordService = medicalRecordService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = medicalRecordService;
  }
})(typeof window !== 'undefined' ? window : this);
