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
      if (!client) return { success: false, error: 'Database client not initialized' };

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
          subjective: subjective || '',
          objective: objective || '',
          vital_signs: vitalSigns || {},
          assessment: assessment || '',
          icd10_code: icd10Code || '',
          plan: plan || '',
          status: isFinal ? 'FINAL' : 'DRAFT'
        };

        let result;
        if (id) {
          // Check if already FINAL (cannot be edited under Permenkes 24/2022)
          const { data: existing } = await client
            .from('medical_records')
            .select('status')
            .eq('id', id)
            .single();

          if (existing && existing.status === 'FINAL') {
            return {
              success: false,
              error: 'Rekam Medis berstatus FINAL telah dikunci dan tidak dapat diubah (Permenkes No. 24/2022).'
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

        // If finalized and attached to appointment, update appointment status to COMPLETED
        if (isFinal && appointmentId) {
          await client
            .from('appointments')
            .update({ status: 'COMPLETED' })
            .eq('id', appointmentId);
        }

        return { success: true, data: result };
      } catch (err) {
        console.warn('[medicalRecordService.saveMedicalRecord]', err.message);
        return { success: false, error: err.message };
      }
    }
  };

  global.medicalRecordService = medicalRecordService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = medicalRecordService;
  }
})(typeof window !== 'undefined' ? window : this);
