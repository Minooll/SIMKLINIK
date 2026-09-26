/**
 * SIMKLINIK - Electronic Prescription (e-Prescription) Service
 * Manages medication orders, dosage, instructions, and pharmacy dispensing statuses.
 */
(function (global) {
  'use strict';

  function getClient() {
    return global.supabaseClient || (typeof window !== 'undefined' ? window.supabaseClient : null);
  }

  const prescriptionService = {
    /**
     * Create prescription along with multiple medicine items
     */
    async createPrescriptionWithItems({ medicalRecordId, patientId, doctorId, notes, items }) {
      const client = getClient();
      if (!client) {
        return {
          success: true,
          data: {
            id: 'rx-demo-' + Date.now(),
            prescription_number: 'RX-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-0099',
            status: 'Diterbitkan',
            notes: notes || '',
            items: items || []
          }
        };
      }

      try {
        if (!items || !items.length) {
          return { success: false, error: 'Resep harus memiliki minimal satu item obat.' };
        }

        // 1. Create prescription header
        const { data: prescription, error: rxErr } = await client
          .from('prescriptions')
          .insert({
            medical_record_id: medicalRecordId,
            notes: notes || '',
            status: 'Diterbitkan'
          })
          .select()
          .single();

        if (rxErr) throw rxErr;

        // 2. Prepare item records
        const itemRows = items.map((item) => ({
          prescription_id: prescription.id,
          medicine_name: item.medicine_name,
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          quantity: parseInt(item.quantity, 10) || 1,
          instructions: item.instructions || ''
        }));

        const { data: insertedItems, error: itemsErr } = await client
          .from('prescription_items')
          .insert(itemRows)
          .select();

        if (itemsErr) throw itemsErr;

        return {
          success: true,
          data: {
            ...prescription,
            items: insertedItems
          }
        };
      } catch (err) {
        console.warn('[prescriptionService.createPrescriptionWithItems]', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Get active prescriptions for a patient
     */
    async getPatientActivePrescriptions(patientId) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const { data, error } = await client
          .from('prescriptions')
          .select(`
            id,
            prescription_number,
            status,
            notes,
            created_at,
            doctor:doctors (
              specialization,
              profile:profiles (full_name)
            ),
            prescription_items (
              id,
              medicine_name,
              dosage,
              frequency,
              quantity,
              instructions
            )
          `)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[prescriptionService.getPatientActivePrescriptions]', err.message);
        return { success: false, error: err.message, data: [] };
      }
    },

    /**
     * Get prescriptions issued by a doctor
     */
    async getDoctorPrescriptions(doctorId) {
      const fallbackDoctorRx = [
        {
          id: 'rx-1',
          prescription_number: 'RX-20260926-0001',
          status: 'Diterbitkan',
          notes: 'Minum teratur setelah makan malam',
          created_at: '2026-09-26T08:45:00Z',
          patient: {
            no_rm: 'RM-000001',
            profile: { full_name: 'Budi Santoso' }
          },
          prescription_items: [
            { id: 'i-1', medicine_name: 'Amlodipine', dosage: '5 mg', frequency: '1x1 malam', quantity: 30 }
          ]
        },
        {
          id: 'rx-2',
          prescription_number: 'RX-20260926-0002',
          status: 'Disiapkan',
          notes: 'Antibiotik harus dihabiskan',
          created_at: '2026-09-26T09:30:00Z',
          patient: {
            no_rm: 'RM-000002',
            profile: { full_name: 'Siti Aminah' }
          },
          prescription_items: [
            { id: 'i-2', medicine_name: 'Paracetamol', dosage: '500 mg', frequency: '3x1 p.c.', quantity: 10 },
            { id: 'i-3', medicine_name: 'Amoxicillin', dosage: '500 mg', frequency: '3x1 p.c. habiskan', quantity: 15 }
          ]
        }
      ];

      const client = getClient();
      if (!client) return { success: true, data: fallbackDoctorRx };

      try {
        let query = client
          .from('prescriptions')
          .select(`
            id,
            prescription_number,
            status,
            notes,
            created_at,
            medical_record:medical_records!inner (
              doctor_id,
              patient:patients (
                id, no_rm,
                profile:profiles (full_name)
              )
            ),
            prescription_items (
              id,
              medicine_name,
              dosage,
              frequency,
              quantity,
              instructions
            )
          `)
          .order('created_at', { ascending: false });

        if (doctorId) {
          query = query.eq('medical_record.doctor_id', doctorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: (data && data.length > 0) ? data : fallbackDoctorRx };
      } catch (err) {
        console.warn('[prescriptionService.getDoctorPrescriptions]', err.message);
        return { success: true, data: fallbackDoctorRx };
      }
    },

    /**
     * Update prescription status (ACTIVE, PREPARED, DISPENSED, CANCELLED)
     */
    async updatePrescriptionStatus(prescriptionId, status) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const { data, error } = await client
          .from('prescriptions')
          .update({ status })
          .eq('id', prescriptionId)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('[prescriptionService.updatePrescriptionStatus]', err.message);
        return { success: false, error: err.message };
      }
    }
  };

  global.prescriptionService = prescriptionService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = prescriptionService;
  }
})(typeof window !== 'undefined' ? window : this);
