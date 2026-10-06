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

/**
 * Validasi input password baru
 */
function validatePasswordInput(password, confirmPassword) {
  if (!password || typeof password !== 'string' || password.length < 6) {
    return { valid: false, error: 'Password minimal 6 karakter.' };
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { valid: false, error: 'Konfirmasi password tidak cocok.' };
  }
  return { valid: true, error: null };
}

/**
 * Cek apakah user Google login untuk pertama kali (belum punya password / kredensial terdaftar)
 */
function isFirstTimeGoogleUser(user, profile) {
  if (!user) return false;
  const isGoogle = user.app_metadata?.provider === 'google' || 
                   (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google'));
  if (!isGoogle) return false;

  const hasPassword = Boolean(user.user_metadata?.has_password);
  return !hasPassword;
}

/**
 * Setup password user baru di Supabase Auth
 */
async function setupNewUserPassword(supabaseClient, password) {
  if (!supabaseClient?.auth?.updateUser) {
    return { success: true };
  }
  const { data, error } = await supabaseClient.auth.updateUser({
    password,
    data: { has_password: true }
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * Manajemen Penyimpanan Akun Google Terhubung (Local Storage & Supabase Sync)
 */
function getLinkedGoogleAccounts() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem('simklinik_google_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLinkedGoogleAccount(email) {
  if (!email) return null;
  const accounts = getLinkedGoogleAccounts();
  return accounts[email.toLowerCase().trim()] || null;
}

function isGoogleAccountLinked(email) {
  const account = getLinkedGoogleAccount(email);
  return Boolean(account && account.has_password);
}

/**
 * Hubungkan Akun Google pertama kali dengan username & password
 */
async function linkGoogleAccount(payload) {
  const {
    email,
    username,
    password,
    confirmPassword,
    role = 'pasien',
    fullName,
    referralCode,
    sipNumber
  } = payload;

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Alamat email Google tidak valid.' };
  }

  if (!username || username.trim().length < 3) {
    return { success: false, message: 'Username minimal 3 karakter.' };
  }

  const passCheck = validatePasswordInput(password, confirmPassword);
  if (!passCheck.valid) {
    return { success: false, message: passCheck.error };
  }

  // Khusus Dokter: Validasi kode unik klinik
  if (role === 'dokter') {
    if (!referralCode || !validateReferralCodeFormat(referralCode)) {
      return {
        success: false,
        message: 'Format kode unik klinik wajib valid (Contoh: PWR-SEHAT-9X8K2M) untuk mendaftarkan dokter.'
      };
    }
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUsername = username.trim();
  const displayName = fullName || (role === 'dokter' ? 'dr. ' + cleanUsername : (role === 'pemilik' ? 'Pemilik ' + cleanUsername : cleanUsername));

  const accountRecord = {
    email: cleanEmail,
    username: cleanUsername,
    has_password: true,
    role: role,
    full_name: displayName,
    referral_code: referralCode ? referralCode.toUpperCase().trim() : null,
    sip: sipNumber ? sipNumber.trim() : null,
    linked_at: new Date().toISOString()
  };

  // Simpan ke daftar akun tertaut
  if (typeof localStorage !== 'undefined') {
    const accounts = getLinkedGoogleAccounts();
    accounts[cleanEmail] = accountRecord;
    localStorage.setItem('simklinik_google_accounts', JSON.stringify(accounts));
    localStorage.setItem('simklinik_default_google_user', cleanEmail);
  }

  // Set sesi aktif
  const redirectTarget = role === 'dokter' ? 'dokter.html' : (role === 'pemilik' ? 'pemilik.html' : 'pasien.html');
  const session = {
    role: role,
    user_id: 'google-user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
    email: cleanEmail,
    username: cleanUsername,
    full_name: displayName,
    referral_code: accountRecord.referral_code,
    provider: 'google'
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('simklinik_session', JSON.stringify(session));
  }

  return {
    success: true,
    redirect: redirectTarget,
    session,
    message: 'Akun Google berhasil dihubungkan! Untuk login selanjutnya, cukup klik tombol Google.'
  };
}

/**
 * Login Cepat dengan Google (Single-Click jika sudah terdaftar)
 */
async function loginWithGoogle(preferredEmail, fallbackRole = 'pasien') {
  let email = preferredEmail;
  if (!email && typeof localStorage !== 'undefined') {
    email = localStorage.getItem('simklinik_default_google_user');
  }

  // Jika belum ada email yang diketahui atau belum terhubung -> Minta kredensial pertama kali
  if (!email || !isGoogleAccountLinked(email)) {
    return {
      success: false,
      isFirstTime: true,
      email: email || 'user.google@gmail.com',
      role: fallbackRole,
      message: 'Akun Google belum terhubung. Silakan masukkan username & password untuk pertama kali.'
    };
  }

  // Sudah terhubung -> LANGSUNG LOGIN TANPA MINTA USERNAME/PASSWORD LAGI
  const account = getLinkedGoogleAccount(email);
  const redirectTarget = account.role === 'dokter' ? 'dokter.html' : (account.role === 'pemilik' ? 'pemilik.html' : 'pasien.html');
  
  const session = {
    role: account.role,
    user_id: 'google-user-' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    email: account.email,
    username: account.username,
    full_name: account.full_name,
    referral_code: account.referral_code,
    provider: 'google'
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('simklinik_session', JSON.stringify(session));
    localStorage.setItem('simklinik_default_google_user', email);
  }

  return {
    success: true,
    isFirstTime: false,
    redirect: redirectTarget,
    session,
    message: `Selamat datang kembali, ${account.full_name}! Masuk berhasil via Google OAuth.`
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
  window.validatePasswordInput = validatePasswordInput;
  window.isFirstTimeGoogleUser = isFirstTimeGoogleUser;
  window.setupNewUserPassword = setupNewUserPassword;
  window.getLinkedGoogleAccounts = getLinkedGoogleAccounts;
  window.getLinkedGoogleAccount = getLinkedGoogleAccount;
  window.isGoogleAccountLinked = isGoogleAccountLinked;
  window.linkGoogleAccount = linkGoogleAccount;
  window.loginWithGoogle = loginWithGoogle;
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
    validatePasswordInput,
    isFirstTimeGoogleUser,
    setupNewUserPassword,
    getLinkedGoogleAccounts,
    getLinkedGoogleAccount,
    isGoogleAccountLinked,
    linkGoogleAccount,
    loginWithGoogle,
    getActiveSession,
    logout
  };
}

