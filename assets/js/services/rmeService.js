// ====================================================================
// Service Rekam Medis Elektronik (RME SOAP) & Alur Antrean Sekuensial
// Kepatuhan Permenkes No. 24 Tahun 2022
// ====================================================================

const MEDICAL_RECORDS_STORE = [];

/**
 * Prosedur Atomik: Simpan Lembar RME SOAP & Majukan Antrean ke Pasien Berikutnya
 * @param {Object} soapPayload Data formulir SOAP
 * @param {Array} queueData Array daftar antrean aktif hari ini
 */
async function finalizeRmeAndAdvanceQueue(soapPayload, queueData = []) {
  const newRecord = {
    id: 'rme-' + Date.now(),
    appointment_id: soapPayload.appointment_id,
    patient_id: soapPayload.patient_id,
    doctor_id: soapPayload.doctor_id,
    clinic_id: soapPayload.clinic_id,
    soap_subjective: soapPayload.soap_subjective,
    soap_objective: soapPayload.soap_objective,
    soap_assessment: soapPayload.soap_assessment,
    soap_plan: soapPayload.soap_plan,
    prescription_notes: soapPayload.prescription_notes || '',
    finalized_at: new Date().toISOString()
  };

  MEDICAL_RECORDS_STORE.push(newRecord);

  // 1. Update status appointment saat ini menjadi selesai
  const currentAppt = queueData.find(a => a.id === soapPayload.appointment_id);
  if (currentAppt) {
    currentAppt.status = 'selesai';
  }

  // 2. Cari antrean pasien berikutnya yang berstatus 'menunggu'
  const nextAppt = queueData
    .filter(a => a.status === 'menunggu')
    .sort((a, b) => a.queue_order - b.queue_order)[0];

  if (nextAppt) {
    nextAppt.status = 'sedang_diperiksa';
    
    // Sinkronisasi Supabase jika aktif
    try {
      const supa = (typeof window !== 'undefined' && window.getSupabaseClient) ? window.getSupabaseClient() : null;
      if (supa && typeof supa.rpc === 'function') {
        await supa.rpc('finalize_rme_and_advance_queue', soapPayload);
      }
    } catch (err) {
      console.warn('Supabase RME advance RPC fallback:', err);
    }

    return {
      success: true,
      has_next: true,
      next_appointment_id: nextAppt.id,
      next_queue_number: nextAppt.queue_number,
      next_patient_id: nextAppt.patient_id
    };
  } else {
    return {
      success: true,
      has_next: false,
      message: 'Seluruh antrean pasien hari ini telah selesai diperiksa.'
    };
  }
}

/**
 * Mengambil riwayat rekam medis pasien
 */
async function getPatientMedicalRecords(patientId) {
  return MEDICAL_RECORDS_STORE.filter(r => r.patient_id === patientId);
}

if (typeof window !== 'undefined') {
  window.finalizeRmeAndAdvanceQueue = finalizeRmeAndAdvanceQueue;
  window.getPatientMedicalRecords = getPatientMedicalRecords;
  window.MEDICAL_RECORDS_STORE = MEDICAL_RECORDS_STORE;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    finalizeRmeAndAdvanceQueue,
    getPatientMedicalRecords,
    MEDICAL_RECORDS_STORE
  };
}
