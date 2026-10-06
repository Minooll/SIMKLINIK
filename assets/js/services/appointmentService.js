// ====================================================================
// Service Janji Temu & Manajemen Kuota Dokter - SIMKLINIK Purworejo
// Aturan Kunci: Proteksi Pembatalan 12 Jam (Strict Cancellation Guard)
// ====================================================================

const APPOINTMENTS_STORE = [];

/**
 * Validasi apakah pembatalan janji diizinkan (Minimal 12 Jam Sebelum Jadwal)
 * @param {string} dateStr Format YYYY-MM-DD
 * @param {string} timeStr Format HH:mm:ss atau HH:mm
 * @param {Date} now Waktu acuan sekarang
 * @returns {boolean} True jika sisa waktu >= 12 jam
 */
function isCancellationAllowed(dateStr, timeStr, now = new Date()) {
  if (!dateStr) return false;
  const timeFormatted = timeStr ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr) : '08:00:00';
  const targetDate = new Date(`${dateStr}T${timeFormatted}`);
  
  if (isNaN(targetDate.getTime())) return false;

  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= 12;
}

/**
 * Membuat janji temu baru dengan penerbitan nomor antrean sekuensial
 */
async function createAppointment(payload) {
  const appointmentDate = payload.appointment_date || new Date().toISOString().split('T')[0];
  const appointmentTime = payload.appointment_time || '09:00:00';

  // Hitung urutan antrean dokter pada hari bersangkutan
  const existingToday = APPOINTMENTS_STORE.filter(
    a => a.doctor_id === payload.doctor_id && a.appointment_date === appointmentDate
  );
  const queueOrder = existingToday.length + 1;
  const queueNumber = `A-${String(queueOrder).padStart(2, '0')}`;

  const newAppointment = {
    id: payload.id || 'appt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    clinic_id: payload.clinic_id,
    doctor_id: payload.doctor_id,
    patient_id: payload.patient_id,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    queue_number: queueNumber,
    queue_order: queueOrder,
    status: payload.status || 'menunggu',
    created_at: new Date().toISOString()
  };

  APPOINTMENTS_STORE.push(newAppointment);

  // Sinkronisasi ke Supabase jika aktif
  try {
    const supa = (typeof window !== 'undefined' && window.getSupabaseClient) ? window.getSupabaseClient() : null;
    if (supa && typeof supa.from === 'function') {
      await supa.from('appointments').insert(newAppointment);
    }
  } catch (err) {
    console.warn('Supabase appointment insert fallback:', err);
  }

  return newAppointment;
}

/**
 * Membatalkan janji temu dengan validasi aturan 12 jam
 */
async function cancelAppointment(appointment, now = new Date()) {
  const allowed = isCancellationAllowed(
    appointment.appointment_date,
    appointment.appointment_time,
    now
  );

  if (!allowed) {
    return {
      success: false,
      message: 'Janji tidak dapat dibatalkan karena waktu pemeriksaan kurang dari 12 jam.'
    };
  }

  // Update status appointment
  const found = APPOINTMENTS_STORE.find(a => a.id === appointment.id);
  if (found) {
    found.status = 'dibatalkan';
  }

  try {
    const supa = (typeof window !== 'undefined' && window.getSupabaseClient) ? window.getSupabaseClient() : null;
    if (supa && typeof supa.rpc === 'function') {
      await supa.rpc('cancel_appointment', {
        p_appointment_id: appointment.id,
        p_user_id: appointment.patient_id
      });
    }
  } catch (err) {
    console.warn('Supabase cancel RPC fallback:', err);
  }

  return {
    success: true,
    message: 'Janji berhasil dibatalkan.'
  };
}

/**
 * Mengambil daftar antrean dokter hari ini
 */
async function getDoctorQueueToday(doctorId, dateStr = new Date().toISOString().split('T')[0]) {
  return APPOINTMENTS_STORE.filter(
    a => a.doctor_id === doctorId && a.appointment_date === dateStr
  ).sort((a, b) => a.queue_order - b.queue_order);
}

/**
 * Mengambil riwayat janji temu pasien
 */
async function getPatientAppointments(patientId) {
  return APPOINTMENTS_STORE.filter(a => a.patient_id === patientId);
}

if (typeof window !== 'undefined') {
  window.isCancellationAllowed = isCancellationAllowed;
  window.createAppointment = createAppointment;
  window.cancelAppointment = cancelAppointment;
  window.getDoctorQueueToday = getDoctorQueueToday;
  window.getPatientAppointments = getPatientAppointments;
  window.APPOINTMENTS_STORE = APPOINTMENTS_STORE;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isCancellationAllowed,
    createAppointment,
    cancelAppointment,
    getDoctorQueueToday,
    getPatientAppointments,
    APPOINTMENTS_STORE
  };
}
