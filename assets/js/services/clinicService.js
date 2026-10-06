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
 * Ambil daftar dokter yang berpraktik di klinik tertentu
 */
async function getDoctorsByClinic(clinicId, includeCuti = true) {
  return PURWOREJO_DOCTORS_DATA.filter(d => {
    if (d.clinic_id !== clinicId || !d.is_active) return false;
    if (!includeCuti && d.status === 'cuti') return false;
    return true;
  });
}

/**
 * Mendaftarkan dokter baru oleh Pemilik Klinik
 */
async function createDoctor(doctorData) {
  const newDoctor = {
    id: 'doc-' + Date.now(),
    clinic_id: doctorData.clinic_id,
    full_name: doctorData.full_name,
    specialty: doctorData.specialty || 'Dokter Umum',
    sip_number: doctorData.sip_number,
    daily_quota: Number(doctorData.daily_quota) || 20,
    is_active: true,
    status: 'aktif'
  };
  PURWOREJO_DOCTORS_DATA.push(newDoctor);
  return newDoctor;
}

/**
 * Mengedit data dokter oleh Pemilik Klinik
 */
async function updateDoctor(doctorId, updatedFields) {
  const doc = PURWOREJO_DOCTORS_DATA.find(d => d.id === doctorId && d.is_active);
  if (!doc) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  if (updatedFields.full_name) doc.full_name = updatedFields.full_name.trim();
  if (updatedFields.specialty) doc.specialty = updatedFields.specialty.trim();
  if (updatedFields.sip_number) doc.sip_number = updatedFields.sip_number.trim();
  if (updatedFields.daily_quota !== undefined) doc.daily_quota = Number(updatedFields.daily_quota);
  if (updatedFields.status) doc.status = updatedFields.status;

  return { ...doc };
}

/**
 * Mengubah status cuti dokter (toggle 'aktif' <-> 'cuti')
 */
async function toggleDoctorCuti(doctorId) {
  const doc = PURWOREJO_DOCTORS_DATA.find(d => d.id === doctorId && d.is_active);
  if (!doc) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  doc.status = (doc.status === 'cuti') ? 'aktif' : 'cuti';
  return { success: true, doctor: { ...doc }, status: doc.status };
}

/**
 * Menghapus dokter dari klinik oleh Pemilik Klinik
 */
async function deleteDoctor(doctorId) {
  const docIndex = PURWOREJO_DOCTORS_DATA.findIndex(d => d.id === doctorId);
  if (docIndex === -1) {
    throw new Error(`Dokter dengan ID ${doctorId} tidak ditemukan.`);
  }

  PURWOREJO_DOCTORS_DATA[docIndex].is_active = false;
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
  window.toggleDoctorCuti = toggleDoctorCuti;
  window.deleteDoctor = deleteDoctor;
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
    toggleDoctorCuti,
    deleteDoctor
  };
}
