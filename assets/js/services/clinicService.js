// ====================================================================
// Service Pengelola Klinik & Dokter Regional Purworejo
// ====================================================================

const PURWOREJO_CLINICS_DATA = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Klinik Pratama Sehat Mandiri Purworejo',
    address: 'Jl. Jenderal Sudirman No. 45, Purworejo',
    district: 'Purworejo Kota',
    phone: '0275-321111',
    referral_code: 'PWR-SEHAT-9X8K2M',
    is_active: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Klinik Pratama & Bersalin Kutoarjo Medika',
    address: 'Jl. Pangeran Diponegoro No. 88, Kutoarjo',
    district: 'Kutoarjo',
    phone: '0275-322222',
    referral_code: 'PWR-MEDIKA-7K3N9Q',
    is_active: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Klinik Pratama Keluarga Banyuurip',
    address: 'Jl. Banyuurip Raya KM 3, Banyuurip',
    district: 'Banyuurip',
    phone: '0275-323333',
    referral_code: 'PWR-KLGUR-4B8W2L',
    is_active: true
  }
];

const PURWOREJO_DOCTORS_DATA = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    full_name: 'dr. Budi Santoso',
    specialty: 'Dokter Umum',
    sip_number: 'SIP-PWR-001/2024',
    daily_quota: 20,
    is_active: true,
    status: 'aktif'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    full_name: 'drg. Siti Rahayu',
    specialty: 'Dokter Gigi',
    sip_number: 'SIP-PWR-002/2024',
    daily_quota: 15,
    is_active: true,
    status: 'aktif'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    clinic_id: '22222222-2222-2222-2222-222222222222',
    full_name: 'dr. Hendra Wijaya, Sp.A',
    specialty: 'Spesialis Anak',
    sip_number: 'SIP-PWR-003/2024',
    daily_quota: 25,
    is_active: true,
    status: 'aktif'
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    clinic_id: '33333333-3333-3333-3333-333333333333',
    full_name: 'dr. Ratna Dewi',
    specialty: 'Dokter Umum',
    sip_number: 'SIP-PWR-004/2024',
    daily_quota: 20,
    is_active: true,
    status: 'aktif'
  }
];

/**
 * Mengambil seluruh daftar klinik aktif di Purworejo
 */
async function getClinics() {
  return [...PURWOREJO_CLINICS_DATA];
}

/**
 * Filter klinik berdasarkan kecamatan di Purworejo
 */
async function getClinicsByDistrict(district) {
  if (!district || district.toLowerCase() === 'semua') {
    return [...PURWOREJO_CLINICS_DATA];
  }
  return PURWOREJO_CLINICS_DATA.filter(
    c => c.district.toLowerCase() === district.toLowerCase()
  );
}

/**
 * Ambil detail klinik berdasarkan ID
 */
async function getClinicById(id) {
  return PURWOREJO_CLINICS_DATA.find(c => c.id === id) || null;
}

/**
 * Menghasilkan kode referral kriptografis unik bagi klinik
 * Format: PWR-[PREFIX]-[6 ALPHANUMERIC]
 */
function generateReferralCode(prefix = 'KLINIK') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PWR-${prefix.toUpperCase().slice(0, 8)}-${randStr}`;
}

/**
 * Format tanggal ke format string YYYY-MM-DD
 */
function toDateString(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format tanggal ke tampilan bahasa Indonesia (e.g. 8 Okt 2026)
 */
function formatCutiDateIndo(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${months[monthIdx] || ''} ${year}`;
}

/**
 * Simpan data dokter ke localStorage jika di browser
 */
function saveDoctorsData() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('simklinik_doctors_data', JSON.stringify(PURWOREJO_DOCTORS_DATA));
    } catch (e) {
      console.warn('LocalStorage save doctors failed:', e);
    }
  }
}

/**
 * Muat data dokter dari localStorage jika tersedia
 */
function loadDoctorsData() {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('simklinik_doctors_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          PURWOREJO_DOCTORS_DATA.length = 0;
          PURWOREJO_DOCTORS_DATA.push(...parsed);
        }
      }
    } catch (e) {
      console.warn('LocalStorage load doctors failed:', e);
    }
  }
}

// Inisialisasi awal sinkronisasi data
loadDoctorsData();

/**
 * Cek apakah dokter sedang dalam masa cuti pada tanggal acuan tertentu.
 * Jika tanggal acuan di dunia nyata sudah melewati batas akhir cuti (cuti_end),
 * sistem secara otomatis mengembalikan status dokter menjadi 'aktif'.
 *
 * @param {Object} doctor Objek dokter
 * @param {Date|string} checkDate Tanggal acuan (default: waktu sekarang)
 * @returns {boolean} True jika dokter sedang cuti pada tanggal tersebut
 */
function isDoctorOnLeave(doctor, checkDate = new Date()) {
  if (!doctor || !doctor.is_active) return false;

  const targetDateStr = toDateString(checkDate);

  // Jika ada batas rentang tanggal cuti
  if (doctor.cuti_end) {
    const endStr = toDateString(doctor.cuti_end);
    const startStr = doctor.cuti_start ? toDateString(doctor.cuti_start) : targetDateStr;

    // Jika tanggal sekarang di dunia nyata sudah melewati tanggal selesai cuti:
    // SISTEM OTOMATIS MENGAKTIFKAN KEMBALI DOKTER
    if (targetDateStr > endStr) {
      doctor.status = 'aktif';
      saveDoctorsData();
      return false;
    }

    // Jika masih sebelum tanggal mulai cuti
    if (targetDateStr < startStr) {
      return false;
    }

    // Berada di dalam rentang cuti aktif [cuti_start, cuti_end]
    doctor.status = 'cuti';
    return true;
  }

  // Fallback jika status 'cuti' tanpa tanggal eksplisit
  return doctor.status === 'cuti';
}

/**
 * Ambil daftar dokter yang berpraktik di klinik tertentu
 * Secara otomatis mengevaluasi kedaluwarsa cuti berdasarkan tanggal acuan.
 */
async function getDoctorsByClinic(clinicId, includeCuti = true, checkDate = new Date()) {
  loadDoctorsData();
  return PURWOREJO_DOCTORS_DATA
    .filter(d => d.clinic_id === clinicId && d.is_active)
    .filter(d => {
      const onLeave = isDoctorOnLeave(d, checkDate);
      if (!includeCuti && onLeave) return false;
      return true;
    })
    .map(d => {
      const onLeave = isDoctorOnLeave(d, checkDate);
      return {
        ...d,
        status: onLeave ? 'cuti' : 'aktif',
        is_on_leave: onLeave,
        cuti_label: onLeave && d.cuti_end ? `s/d ${formatCutiDateIndo(d.cuti_end)}` : ''
      };
    });
}

/**
 * Mendaftarkan dokter baru oleh Pemilik Klinik
 */
async function createDoctor(doctorData) {
  loadDoctorsData();
  const newDoctor = {
    id: 'doc-' + Date.now(),
    clinic_id: doctorData.clinic_id,
    full_name: doctorData.full_name,
    specialty: doctorData.specialty || 'Dokter Umum',
    sip_number: doctorData.sip_number,
    daily_quota: Number(doctorData.daily_quota) || 20,
    is_active: true,
    status: 'aktif',
    cuti_start: null,
    cuti_end: null,
    cuti_reason: null
  };
  PURWOREJO_DOCTORS_DATA.push(newDoctor);
  saveDoctorsData();
  return newDoctor;
}

/**
 * Mengedit data dokter oleh Pemilik Klinik
 */
async function updateDoctor(doctorId, updatedFields) {
  loadDoctorsData();
  const doc = PURWOREJO_DOCTORS_DATA.find(d => d.id === doctorId && d.is_active);
  if (!doc) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  if (updatedFields.full_name) doc.full_name = updatedFields.full_name.trim();
  if (updatedFields.specialty) doc.specialty = updatedFields.specialty.trim();
  if (updatedFields.sip_number) doc.sip_number = updatedFields.sip_number.trim();
  if (updatedFields.daily_quota !== undefined) doc.daily_quota = Number(updatedFields.daily_quota);
  if (updatedFields.status) doc.status = updatedFields.status;

  saveDoctorsData();
  return { ...doc };
}

/**
 * Mengatur masa cuti dokter secara detail (Durasi Hari atau Kalender Rentang Tanggal)
 * @param {string} doctorId ID dokter
 * @param {Object} options { startDate, endDate, durationDays, reason }
 */
async function setDoctorCuti(doctorId, options = {}) {
  loadDoctorsData();
  const doc = PURWOREJO_DOCTORS_DATA.find(d => d.id === doctorId && d.is_active);
  if (!doc) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  const now = new Date();
  const todayStr = toDateString(now);
  let startStr = options.startDate ? toDateString(options.startDate) : todayStr;
  let endStr = options.endDate ? toDateString(options.endDate) : null;

  // Jika durasi hari dipilih (misal 1 hari, 2 hari, 3 hari, 7 hari)
  if (options.durationDays && !endStr) {
    const days = Math.max(1, parseInt(options.durationDays, 10));
    const startObj = new Date(startStr);
    const endObj = new Date(startObj.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    endStr = toDateString(endObj);
  }

  if (!endStr) {
    endStr = startStr;
  }

  // Validasi urutan tanggal
  if (endStr < startStr) {
    endStr = startStr;
  }

  doc.status = 'cuti';
  doc.cuti_start = startStr;
  doc.cuti_end = endStr;
  doc.cuti_reason = options.reason || 'Izin Cuti';
  doc.cuti_set_at = new Date().toISOString();

  saveDoctorsData();

  return {
    success: true,
    doctor: { ...doc },
    status: 'cuti',
    cuti_start: startStr,
    cuti_end: endStr,
    cuti_reason: doc.cuti_reason,
    message: `Cuti ${doc.full_name} berhasil diatur: ${formatCutiDateIndo(startStr)} s/d ${formatCutiDateIndo(endStr)} (${doc.cuti_reason}). Setelah tanggal ini terlewati, dokter otomatis kembali aktif.`
  };
}

/**
 * Mengakhiri masa cuti dokter lebih awal dan mengembalikannya ke status aktif
 */
async function endDoctorCuti(doctorId) {
  loadDoctorsData();
  const doc = PURWOREJO_DOCTORS_DATA.find(d => d.id === doctorId && d.is_active);
  if (!doc) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  doc.status = 'aktif';
  doc.cuti_start = null;
  doc.cuti_end = null;
  doc.cuti_reason = null;

  saveDoctorsData();

  return {
    success: true,
    doctor: { ...doc },
    status: 'aktif',
    message: `Cuti dokter ${doc.full_name} telah diakhiri. Dokter kini kembali aktif dan dapat dipilih oleh pasien.`
  };
}

/**
 * Mengubah status cuti dokter (toggle atau quick switch)
 */
async function toggleDoctorCuti(doctorId) {
  loadDoctorsData();
  const doc = PURWOREJO_DOCTORS_DATA.find(d => d.id === doctorId && d.is_active);
  if (!doc) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  const currentlyOnLeave = isDoctorOnLeave(doc);
  if (currentlyOnLeave) {
    return endDoctorCuti(doctorId);
  } else {
    // Default cuti 3 hari
    return setDoctorCuti(doctorId, { durationDays: 3, reason: 'Izin Cuti' });
  }
}

/**
 * Menghapus dokter dari klinik oleh Pemilik Klinik
 */
async function deleteDoctor(doctorId) {
  loadDoctorsData();
  const docIndex = PURWOREJO_DOCTORS_DATA.findIndex(d => d.id === doctorId);
  if (docIndex === -1) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  PURWOREJO_DOCTORS_DATA[docIndex].is_active = false;
  saveDoctorsData();
  return { success: true, doctorId };
}

if (typeof window !== 'undefined') {
  window.getClinics = getClinics;
  window.getClinicsByDistrict = getClinicsByDistrict;
  window.getClinicById = getClinicById;
  window.generateReferralCode = generateReferralCode;
  window.getDoctorsByClinic = getDoctorsByClinic;
  window.createDoctor = createDoctor;
  window.updateDoctor = updateDoctor;
  window.isDoctorOnLeave = isDoctorOnLeave;
  window.setDoctorCuti = setDoctorCuti;
  window.endDoctorCuti = endDoctorCuti;
  window.toggleDoctorCuti = toggleDoctorCuti;
  window.deleteDoctor = deleteDoctor;
  window.toDateString = toDateString;
  window.formatCutiDateIndo = formatCutiDateIndo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getClinics,
    getClinicsByDistrict,
    getClinicById,
    generateReferralCode,
    getDoctorsByClinic,
    createDoctor,
    updateDoctor,
    isDoctorOnLeave,
    setDoctorCuti,
    endDoctorCuti,
    toggleDoctorCuti,
    deleteDoctor,
    toDateString,
    formatCutiDateIndo
  };
}
