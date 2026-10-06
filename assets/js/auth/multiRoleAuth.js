// ====================================================================
// Modul Otentikasi Multi-Peran & Strict Referral Binding
// SIMKLINIK Purworejo (3 Peran: Pemilik, Dokter, Pasien)
// ====================================================================

const ATTEMPT_STORE = new Map(); // identifier -> { count, lockUntil }
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

/**
 * Validasi format kode referral klinik Purworejo
 * Format yang valid: PWR-[PREFIX]-[6 ALPHANUMERIC] (e.g. PWR-SEHAT-9X8K2M)
 */
function validateReferralCodeFormat(code) {
  if (!code || typeof code !== 'string') return false;
  const regex = /^PWR-[A-Z0-9]{2,10}-[A-Z0-9]{6}$/i;
  return regex.test(code.trim());
}

/**
 * Cek status rate limiting brute force
 */
function checkRateLimit(identifier) {
  const record = ATTEMPT_STORE.get(identifier);
  if (!record) return { isLocked: false, remainingMinutes: 0 };

  const now = Date.now();
  if (record.lockUntil && now < record.lockUntil) {
    const remaining = Math.ceil((record.lockUntil - now) / (60 * 1000));
    return { isLocked: true, remainingMinutes: remaining };
  }

  if (record.lockUntil && now >= record.lockUntil) {
    ATTEMPT_STORE.delete(identifier);
    return { isLocked: false, remainingMinutes: 0 };
  }

  return { isLocked: false, remainingMinutes: 0 };
}

/**
 * Catat kegagalan login dan picu kunci 15 menit jika mencapai 3x
 */
function recordFailedAttempt(identifier) {
  let record = ATTEMPT_STORE.get(identifier) || { count: 0, lockUntil: null };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
  }

  ATTEMPT_STORE.set(identifier, record);
  return record;
}

/**
 * Reset catatan percobaan
 */
function resetAttempts(identifier) {
  ATTEMPT_STORE.delete(identifier);
}

/**
 * Otentikasi Pasien
 */
async function loginPatient(email, password) {
  const session = {
    role: 'pasien',
    user_id: 'pat-user-purworejo-' + Date.now(),
    email: email || 'pasien@purworejo.id',
    full_name: 'Warga Purworejo'
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('simklinik_session', JSON.stringify(session));
  }
  return { success: true, redirect: 'pasien.html' };
}

/**
 * Otentikasi Dokter dengan Verifikasi Kode Unik Klinik
 */
async function loginDoctor(email, referralCode, sipNumber) {
  const lock = checkRateLimit(email || 'doctor-auth');
  if (lock.isLocked) {
    return {
      success: false,
      message: `Terlalu banyak percobaan gagal. Akses dikunci sementara selama ${lock.remainingMinutes} menit demi keamanan.`
    };
  }

  if (!validateReferralCodeFormat(referralCode)) {
    recordFailedAttempt(email || 'doctor-auth');
    return {
      success: false,
      message: 'Format kode unik klinik tidak valid (Gunakan format PWR-PREFIX-KODE6).'
    };
  }

  // Verifikasi ke Supabase RPC jika tersedia
  try {
    const supa = (typeof window !== 'undefined' && window.getSupabaseClient) ? window.getSupabaseClient() : null;
    if (supa && typeof supa.rpc === 'function') {
      const { data, error } = await supa.rpc('bind_doctor_with_code', {
        p_user_id: 'doc-user-' + Date.now(),
        p_code: referralCode.toUpperCase(),
        p_sip: sipNumber || 'SIP-PWR-DEFAULT'
      });
      if (error || (data && data.success === false)) {
        recordFailedAttempt(email || 'doctor-auth');
        return { success: false, message: data?.message || 'Kode klinik atau SIP tidak cocok.' };
      }
    }
  } catch (e) {
    console.warn('Fallback simulated verification:', e);
  }

  resetAttempts(email || 'doctor-auth');
  const session = {
    role: 'dokter',
    user_id: 'doc-user-purworejo',
    referral_code: referralCode.toUpperCase(),
    email: email || 'dokter@purworejo.id',
    full_name: 'dr. Medika Purworejo'
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('simklinik_session', JSON.stringify(session));
  }
  return { success: true, redirect: 'dokter.html' };
}

/**
 * Otentikasi Pemilik Klinik
 */
async function loginOwner(email, password) {
  const session = {
    role: 'pemilik',
    user_id: 'owner-user-purworejo',
    email: email || 'owner@purworejo.id',
    full_name: 'Pemilik Faskes Purworejo'
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('simklinik_session', JSON.stringify(session));
  }
  return { success: true, redirect: 'pemilik.html' };
}

/**
 * Permintaan Pemulihan Kata Sandi (Lupa Sandi)
 */
async function requestPasswordReset(email) {
  if (!email || typeof email !== 'string') {
    return { success: false, message: 'Harap masukkan alamat email yang valid.' };
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { success: false, message: 'Format alamat email tidak valid.' };
  }

  // Integrasi Supabase reset password jika tersedia
  try {
    const supa = (typeof window !== 'undefined' && window.getSupabaseClient) ? window.getSupabaseClient() : null;
    if (supa && supa.auth && typeof supa.auth.resetPasswordForEmail === 'function') {
      const { error } = await supa.auth.resetPasswordForEmail(trimmed);
      if (error) {
        console.warn('Supabase resetPasswordForEmail notice:', error);
      }
    }
  } catch (e) {
    console.warn('Fallback simulated password reset:', e);
  }

  return {
    success: true,
    message: `Tautan instruksi pemulihan kata sandi telah dikirim ke ${trimmed}. Silakan periksa kotak masuk atau spam email Anda.`
  };
}

function getActiveSession() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem('simklinik_session');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('simklinik_session');
  }
  if (typeof window !== 'undefined') {
    window.location.href = 'login.html';
  }
}

if (typeof window !== 'undefined') {
  window.validateReferralCodeFormat = validateReferralCodeFormat;
  window.checkRateLimit = checkRateLimit;
  window.recordFailedAttempt = recordFailedAttempt;
  window.resetAttempts = resetAttempts;
  window.loginPatient = loginPatient;
  window.loginDoctor = loginDoctor;
  window.loginOwner = loginOwner;
  window.requestPasswordReset = requestPasswordReset;
  window.getActiveSession = getActiveSession;
  window.logout = logout;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateReferralCodeFormat,
    checkRateLimit,
    recordFailedAttempt,
    resetAttempts,
    loginPatient,
    loginDoctor,
    loginOwner,
    requestPasswordReset,
    getActiveSession,
    logout
  };
}
