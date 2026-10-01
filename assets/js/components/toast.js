/**
 * SIMKLINIK - Accessible Toast Notification Component
 * Zero inline styles, uses CSS classes defined in modal.css.
 */
(function (global) {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
      }
    }
    return container;
  }

  const ICONS = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  /**
   * Mengubah pesan error teknis (Supabase, Postgres, Auth, Network) menjadi bahasa Indonesia yang ramah dan mudah dipahami.
   */
  function humanizeErrorMessage(rawMsg) {
    if (!rawMsg) return 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';

    let msg = typeof rawMsg === 'string' ? rawMsg : (rawMsg.message || rawMsg.error || String(rawMsg));
    msg = msg.trim();

    // 1. Missing Column in PostgREST / Supabase Schema Cache
    if (/could not find the '([^']+)' column of '([^']+)' in the schema cache/i.test(msg) ||
        /column "?([^"\s]+)"? of relation [^\s]+ does not exist/i.test(msg)) {
      const colMatch = msg.match(/'([^']+)' column/) || msg.match(/column "?([^"\s]+)"?/);
      const colName = (colMatch ? colMatch[1] : '').toLowerCase();
      if (colName === 'address' || msg.toLowerCase().includes('address')) {
        return 'Kolom alamat domisili belum terpasang di database, namun data telah berhasil diamankan di sesi lokal Anda.';
      }
      return `Kolom data (${colName || 'bidang tertentu'}) belum disinkronkan di tabel database. Hubungi administrator klinik.`;
    }

    // 2. Table / relation not found
    if (/relation "([^"]+)" does not exist/i.test(msg) || /table "([^"]+)" does not exist/i.test(msg)) {
      return 'Tabel data klinik belum ditemukan di database. Pastikan migrasi skema database telah dijalankan.';
    }

    // 3. Unique constraint violations (duplicates)
    if (/duplicate key value violates unique constraint/i.test(msg) || /already exists/i.test(msg)) {
      if (/nik/i.test(msg)) {
        return 'Nomor Induk Kependudukan (NIK) ini sudah terdaftar di sistem. Mohon periksa kembali NIK Anda.';
      }
      if (/no_rm/i.test(msg)) {
        return 'Nomor Rekam Medis (No. RM) sudah terdaftar di sistem.';
      }
      if (/email/i.test(msg)) {
        return 'Alamat email ini sudah terdaftar. Silakan masuk dengan akun tersebut atau gunakan email lain.';
      }
      if (/username/i.test(msg)) {
        return 'Nama pengguna (username) sudah digunakan. Silakan gunakan nama pengguna lain.';
      }
      return 'Data yang Anda masukkan sudah terdaftar di sistem (duplikat).';
    }

    // 4. Row-Level Security (RLS)
    if (/violates row-level security policy/i.test(msg) || /permission denied/i.test(msg)) {
      return 'Akses dibatasi oleh aturan keamanan database (RLS). Anda tidak memiliki izin untuk menyimpan tindakan ini.';
    }

    // 5. Not-null constraints
    if (/violates not-null constraint/i.test(msg) || /null value in column/i.test(msg)) {
      return 'Terdapat isian wajib yang masih kosong. Mohon lengkapi seluruh formulir.';
    }

    // 6. Auth & Credential errors
    if (/invalid login credentials/i.test(msg)) {
      return 'Email atau kata sandi yang Anda masukkan salah. Mohon periksa kembali.';
    }
    if (/email not confirmed/i.test(msg)) {
      return 'Email Anda belum diverifikasi. Silakan periksa kotak masuk/spam email Anda untuk tautan aktivasi.';
    }
    if (/user already registered/i.test(msg)) {
      return 'Pengguna dengan email ini sudah terdaftar. Silakan langsung masuk.';
    }
    if (/password should be at least/i.test(msg)) {
      return 'Kata sandi minimal harus terdiri dari 6 karakter.';
    }
    if (/jwt expired/i.test(msg) || /token is expired/i.test(msg) || /invalid claim/i.test(msg)) {
      return 'Sesi login Anda telah berakhir. Silakan muat ulang halaman atau login kembali.';
    }
    if (/role akun tidak sesuai/i.test(msg)) {
      return 'Hak akses (role) akun Anda tidak sesuai dengan portal login yang dipilih.';
    }

    // 7. Network & Fetch errors
    if (/failed to fetch/i.test(msg) || /networkerror/i.test(msg) || /network request failed/i.test(msg)) {
      return 'Koneksi jaringan terputus atau server database tidak merespons. Periksa sambungan internet Anda.';
    }

    // 8. Database client not ready
    if (/database client not initialized/i.test(msg)) {
      return 'Koneksi database belum terhubung. Sistem beroperasi dalam mode demonstrasi lokal.';
    }

    // 9. AI Service / Gemini errors
    if (/all models failed/i.test(msg) || /experiencing high demand/i.test(msg) || /service unavailable/i.test(msg)) {
      return 'Layanan kecerdasan buatan (AI) sedang mengalami antrean tinggi. Mohon coba sesaat lagi.';
    }

    // Strip leading "Error: "
    if (msg.startsWith('Error: ')) {
      msg = msg.slice(7).trim();
    }

    return msg;
  }

  function show(message, type = 'info', duration = 3800) {
    if (type === 'error') {
      message = humanizeErrorMessage(message);
    }

    const parent = ensureContainer();
    if (!parent) return { dismiss: () => {} };

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('role', 'alert');

    const iconHtml = ICONS[type] || ICONS.info;
    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    toast.innerHTML = iconHtml;
    toast.appendChild(textSpan);
    parent.appendChild(toast);

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      toast.classList.add('is-dismissing');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }

    toast.addEventListener('click', dismiss);
    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return { dismiss };
  }

  const Toast = {
    show,
    success(msg, duration) { return show(msg, 'success', duration); },
    error(msg, duration) { return show(msg, 'error', duration); },
    warning(msg, duration) { return show(msg, 'warning', duration); },
    info(msg, duration) { return show(msg, 'info', duration); },
    humanizeErrorMessage
  };

  global.Toast = Toast;
  global.translateError = humanizeErrorMessage;
  global.humanizeError = humanizeErrorMessage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
    module.exports.humanizeErrorMessage = humanizeErrorMessage;
  }
})(typeof window !== 'undefined' ? window : this);
