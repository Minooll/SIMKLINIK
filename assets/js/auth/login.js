(() => {
      'use strict';

      /* ══════════════════════════════════════════════════════════
         CONFIG
         ► Ganti GOOGLE_CLIENT_ID dengan Client ID dari
           Google Cloud Console → APIs & Services → Credentials
           https://console.cloud.google.com/apis/credentials
      ══════════════════════════════════════════════════════════ */
      const MAX_ATTEMPTS     = 5;
      const LOCKOUT_SECS     = 30;
      const BF_KEY           = 'simklinik_bf';

      /* ── DOM refs ───────────────────────────────────────────── */
      const form           = document.getElementById('loginForm');
      const usernameInput  = document.getElementById('username');
      const passwordInput  = document.getElementById('password');
      const togglePwBtn    = document.getElementById('togglePw');
      const iconEye        = togglePwBtn.querySelector('.icon-eye');
      const iconEyeOff     = togglePwBtn.querySelector('.icon-eye-off');
      const btnSubmit      = document.getElementById('btnSubmit');
      const btnText        = btnSubmit.querySelector('.btn-text');
      const alertError     = document.getElementById('alertError');
      const alertErrTitle  = document.getElementById('alertErrTitle');
      const alertErrDesc   = document.getElementById('alertErrDesc');
      const alertWarn      = document.getElementById('alertWarn');
      const lockdownTimer  = document.getElementById('lockdownTimer');
      const csrfToken      = document.getElementById('csrfToken');

      // Success overlay refs
      const successOverlay      = document.getElementById('successOverlay');
      const userAvatarImg       = document.getElementById('userAvatarImg');
      const userAvatarInitial   = document.getElementById('userAvatarInitial');
      const userNameDisplay     = document.getElementById('userNameDisplay');
      const userEmailDisplay    = document.getElementById('userEmailDisplay');
      const userRoleText        = document.getElementById('userRoleText');
      const loginMethodBadge    = document.getElementById('loginMethodBadge');
      const dashboardUrlDisplay = document.getElementById('dashboardUrlDisplay');
      const btnGoDashboard      = document.getElementById('btnGoDashboard');
      const btnBackLogin        = document.getElementById('btnBackLogin');
      const btnGoogleSignIn     = document.getElementById('btnGoogleSignIn');
      const registerForm        = document.getElementById('registerForm');
      const registerFullName    = document.getElementById('registerFullName');
      const registerUsername    = document.getElementById('registerUsername');
      const registerEmail       = document.getElementById('registerEmail');
      const registerPassword    = document.getElementById('registerPassword');
      const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
      const btnRegisterSubmit   = document.getElementById('btnRegisterSubmit');
      const authSwitchLogin     = document.getElementById('authSwitchLogin');
      const authSwitchRegister  = document.getElementById('authSwitchRegister');
      const showRegisterButton  = document.getElementById('showRegisterButton');
      const showLoginButton     = document.getElementById('showLoginButton');
      const authTitle           = document.getElementById('authTitle');
      const authSubtitle        = document.getElementById('authSubtitle');
      const authModeLabel       = document.getElementById('authModeLabel');
      const googleSignInSection = document.getElementById('googleSignInSection');
      const authDivider         = document.getElementById('authDivider');
      const usernameLabel       = document.getElementById('usernameLabel');
      const demoHint            = document.getElementById('demoHint');
      const roleOptions         = document.querySelectorAll('.role-option');

      const demoAccounts = {
        dokter: { label: 'Dokter', username: 'dokter', authEmail: 'dokter@simklinik.id' },
        petugas: { label: 'Petugas', username: 'petugas', authEmail: 'petugas@simklinik.id' },
        pasien: { label: 'Pasien', username: '', authEmail: '' }
      };
      let selectedRole = 'dokter';

      function updateRole(role) {
        selectedRole = role;
        const account = demoAccounts[role];
        roleOptions.forEach(option => {
          const active = option.dataset.role === role;
          option.classList.toggle('is-selected', active);
          option.setAttribute('aria-selected', String(active));
        });
        const isPatient = role === 'pasien';
        usernameLabel.textContent = isPatient ? 'Email pasien' : 'Username';
        usernameInput.type = isPatient ? 'email' : 'text';
        usernameInput.name = isPatient ? 'email' : 'username';
        usernameInput.placeholder = isPatient ? 'nama@gmail.com' : `Masukkan username ${role}`;
        usernameInput.autocomplete = isPatient ? 'email' : 'username';
        demoHint.innerHTML = isPatient
          ? '<span>i</span> Gunakan email Gmail yang sudah terdaftar di Supabase.'
          : `<span>i</span> Username akan dicocokkan dengan akun Supabase ${account.authEmail}.`;
        authSubtitle.textContent = isPatient ? 'Pasien wajib masuk menggunakan alamat email Gmail.' : `Akses khusus ${account.label.toLowerCase()} menggunakan username.`;
        googleSignInSection.classList.toggle('auth-form-hidden', !isPatient);
        authDivider.classList.remove('auth-form-hidden');
        usernameInput.value = '';
        usernameInput.focus();
      }
      roleOptions.forEach(option => option.addEventListener('click', () => updateRole(option.dataset.role)));
      updateRole(selectedRole);

      /* ── CSRF ───────────────────────────────────────────────── */
      const arr = new Uint8Array(24);
      crypto.getRandomValues(arr);
      csrfToken.value = Array.from(arr, b => b.toString(16).padStart(2,'0')).join('');

      /* ── Brute-force helpers ────────────────────────────────── */
      const getBF  = () => { try { return JSON.parse(sessionStorage.getItem(BF_KEY)) || {attempts:0,until:null}; } catch { return {attempts:0,until:null}; } };
      const saveBF = s  => { try { sessionStorage.setItem(BF_KEY, JSON.stringify(s)); } catch {} };
      const clearBF= () => { try { sessionStorage.removeItem(BF_KEY); } catch {} };

      /* ── Password toggle ─────────────────────────────────────── */
      togglePwBtn.addEventListener('click', () => {
        const show = passwordInput.type === 'password';
        passwordInput.type = show ? 'text' : 'password';
        togglePwBtn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
        togglePwBtn.setAttribute('aria-pressed', String(show));
        iconEye.style.display    = show ? 'none' : '';
        iconEyeOff.style.display = show ? '' : 'none';
        passwordInput.focus();
      });

      /* ── :user-invalid fallback ─────────────────────────────── */
      const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
      const dirty = new WeakMap();

      function applyFallback(el) {
        if (!supportsUserInvalid) el.classList.toggle('is-invalid', !el.checkValidity());
        el.setAttribute('aria-invalid', String(!el.checkValidity()));
      }
      [usernameInput, passwordInput].forEach(el => {
        el.addEventListener('input', () => {
          const s = dirty.get(el) || {};
          s.touched = true; dirty.set(el, s);
          if (s.blurred) applyFallback(el);
        });
        el.addEventListener('blur', () => {
          const s = dirty.get(el) || {};
          s.blurred = true; dirty.set(el, s);
          if (s.touched) applyFallback(el);
        });
      });

      /* ── Alert helpers ──────────────────────────────────────── */
      function showError(title, desc) {
        alertWarn.classList.remove('is-visible');
        alertErrTitle.textContent = title;
        alertErrDesc.textContent  = desc;
        alertError.classList.add('is-visible');
        alertError.scrollIntoView({ behavior:'smooth', block:'nearest' });
      }
      function hideError() { alertError.classList.remove('is-visible'); }
      function showWarn()  { alertError.classList.remove('is-visible'); alertWarn.classList.add('is-visible'); }

      /* ── Loading state ──────────────────────────────────────── */
      function setLoading(on) {
        btnSubmit.classList.toggle('is-loading', on);
        btnSubmit.disabled = on;
        btnText.textContent = on ? 'Memproses…' : 'Masuk';
      }

      /* ── Form disable ───────────────────────────────────────── */
      function setFormDisabled(on) {
        usernameInput.disabled = passwordInput.disabled = btnSubmit.disabled = btnGoogleSignIn.disabled = on;
      }

      /* ── Lockout ────────────────────────────────────────────── */
      let lockInterval = null;
      function startLockoutUI(secs) {
        clearInterval(lockInterval);
        lockdownTimer.textContent = secs;
        showWarn(); setFormDisabled(true);
        lockInterval = setInterval(() => {
          secs--;
          lockdownTimer.textContent = secs;
          if (secs <= 0) { clearInterval(lockInterval); alertWarn.classList.remove('is-visible'); setFormDisabled(false); clearBF(); }
        }, 1000);
      }
      function checkLockout() {
        const bf = getBF();
        if (!bf.until) return false;
        const rem = Math.ceil((bf.until - Date.now()) / 1000);
        if (rem > 0) { startLockoutUI(rem); return true; }
        return false;
      }

      /* ── Shake animation ────────────────────────────────────── */
      function shake(el) {
        el.animate(
          [{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},
           {transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],
          {duration:350, easing:'ease-in-out'}
        );
      }

      /* ════════════════════════════════════════════════════════
         SUCCESS OVERLAY — show / hide
      ════════════════════════════════════════════════════════ */
      function showSuccess({ dashboard }) {
        window.location.href = dashboard;
      }

      function hideSuccess() {
        successOverlay.classList.remove('is-visible');
        // Reset form
        form.reset();
        clearBF();
        hideError();
        if (!supportsUserInvalid) {
          [usernameInput, passwordInput].forEach(el => el.classList.remove('is-invalid'));
        }
        [usernameInput, passwordInput].forEach(el => el.setAttribute('aria-invalid','false'));
        usernameInput.focus();
      }

      /* Back to Login button */
      btnBackLogin.addEventListener('click', hideSuccess);
      btnGoDashboard.addEventListener('click', () => {
        window.location.href = dashboardUrlDisplay.textContent;
      });

      function setRegisterLoading(on) {
        btnRegisterSubmit.classList.toggle('is-loading', on);
        btnRegisterSubmit.disabled = on;
        btnRegisterSubmit.querySelector('.btn-text').textContent = on ? 'Mendaftarkan...' : 'Daftar';
      }

      function setAuthMode(mode) {
        const isRegistering = mode === 'register';
        form.classList.toggle('auth-form-hidden', isRegistering);
        registerForm.classList.toggle('auth-form-hidden', !isRegistering);
        authSwitchLogin.classList.toggle('auth-form-hidden', isRegistering);
        authSwitchRegister.classList.toggle('auth-form-hidden', !isRegistering);
        googleSignInSection.classList.toggle('auth-form-hidden', isRegistering || selectedRole !== 'pasien');
        authDivider.classList.toggle('auth-form-hidden', isRegistering);
        authModeLabel.textContent = isRegistering ? 'Mulai perjalanan Anda bersama SIMKLINIK' : 'Akses aman untuk tim klinik';
        authTitle.textContent = isRegistering ? 'Buat Akun Baru' : 'Masuk ke Akun Anda';
        authSubtitle.textContent = isRegistering
          ? 'Lengkapi data berikut untuk membuat akun layanan klinik Anda.'
          : 'Pilih akses Anda, lalu masuk dengan akun yang terdaftar.';
        hideError();
        (isRegistering ? registerFullName : usernameInput).focus();
      }

      async function loginWithSupabase(email, password, selectedRole) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('full_name, username, role')
          .eq('id', data.user.id)
          .single();
        if (profileError) {
          const profileSetupError = new Error('Profil akun belum tersedia. Jalankan supabase-schema.sql di Supabase SQL Editor.');
          profileSetupError.code = 'PROFILE_UNAVAILABLE';
          profileSetupError.cause = profileError;
          throw profileSetupError;
        }

        const profileRoleKey = profile.role === 'Dokter' ? 'dokter' : profile.role === 'Pasien' ? 'pasien' : 'petugas';
        if (profileRoleKey !== selectedRole) {
          await supabaseClient.auth.signOut();
          throw new Error('Role akun tidak sesuai dengan akses yang dipilih.');
        }

        const roleKey = profileRoleKey;
        const dashboard = roleKey + '.html';
        return {
          name: profile.full_name || profile.username || data.user.email,
          email: data.user.email,
          role: profile.role,
          dashboard,
          avatar: data.user.user_metadata?.avatar_url || null,
          method: 'manual'
        };
      }

      /* ════════════════════════════════════════════════════════
         FORM SUBMIT (Manual Login)
      ════════════════════════════════════════════════════════ */
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (checkLockout()) return;

        [usernameInput, passwordInput].forEach(applyFallback);
        if (!form.checkValidity()) {
          const first = form.querySelector(':invalid');
          if (first) first.focus();
          return;
        }

        const identifier = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (selectedRole === 'pasien' && !/^[^\s@]+@gmail\.com$/i.test(identifier)) {
          showError('Email pasien tidak valid', 'Pasien harus masuk menggunakan email dengan format @gmail.com.');
          usernameInput.focus();
          return;
        }

        setLoading(true); hideError();

        try {
          const account = demoAccounts[selectedRole];
          const authEmail = selectedRole === 'pasien' ? identifier : account.authEmail;
          const user = await loginWithSupabase(authEmail, password, selectedRole);
          clearBF(); setLoading(false);
          try {
            if (document.getElementById('rememberMe').checked) localStorage.setItem('simklinik_remember', identifier);
            else localStorage.removeItem('simklinik_remember');
          } catch {}
          showSuccess(user);
        } catch (err) {
          setLoading(false);
          const errorMessage = (err.message || '').toLowerCase();
          if (errorMessage.includes('email not confirmed')) {
            showError('Email Belum Diverifikasi', 'Buka email verifikasi dari Supabase, lalu klik tautannya sebelum mencoba login kembali.');
          } else if (errorMessage.includes('invalid login credentials')) {
            showError('Email atau Password Salah', 'Periksa kembali email dan password Anda. Pastikan email yang digunakan sama dengan saat registrasi.');
          } else if (errorMessage.includes('role akun tidak sesuai')) {
            showError('Akses Role Tidak Sesuai', err.message);
          } else if (err.code === 'PROFILE_UNAVAILABLE') {
            showError('Profil Belum Siap', err.message);
          } else {
            showError('Login Gagal', err.message || 'Tidak dapat masuk. Periksa konfigurasi Supabase dan coba lagi.');
          }
        }
      });

      registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!registerForm.checkValidity()) {
          registerForm.querySelector(':invalid')?.focus();
          return;
        }
        if (registerPassword.value !== registerPasswordConfirm.value) {
          showError('Registrasi Gagal', 'Konfirmasi password tidak sama.');
          registerPasswordConfirm.focus();
          return;
        }

        setRegisterLoading(true); hideError();
        try {
          const { data, error } = await supabaseClient.auth.signUp({
            email: registerEmail.value.trim(),
            password: registerPassword.value,
            options: {
              data: {
                full_name: registerFullName.value.trim(),
                username: registerUsername.value.trim().toLowerCase()
              }
            }
          });
          if (error) throw error;

          if (!data.session) {
            setRegisterLoading(false);
            showError('Verifikasi Email Diperlukan', 'Akun dibuat. Periksa email Anda untuk mengaktifkan akun sebelum login.');
            registerForm.reset();
            return;
          }

          showSuccess({
            name: registerFullName.value.trim(),
            email: registerEmail.value.trim(),
            role: 'Pasien',
            dashboard: 'pasien.html',
            avatar: null,
            method: 'manual'
          });
          setRegisterLoading(false);
        } catch (err) {
          setRegisterLoading(false);
          showError('Registrasi Gagal', err.message || 'Tidak dapat membuat akun baru.');
        }
      });

      showRegisterButton.addEventListener('click', () => setAuthMode('register'));
      showLoginButton.addEventListener('click', () => setAuthMode('login'));

      /* ════════════════════════════════════════════════════════
         GOOGLE SIGN-IN
         Callback dipanggil oleh Google Identity Services
         setelah user berhasil memilih akun Google.
      ════════════════════════════════════════════════════════ */

      function initGoogleSignIn() {
        btnGoogleSignIn.addEventListener('click', async () => {
          btnGoogleSignIn.disabled = true;
          try {
            const { error } = await supabaseClient.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.href }
            });
            if (error) throw error;
          } catch (err) {
            btnGoogleSignIn.disabled = false;
            showError('Login Google Gagal', err.message || 'Provider Google belum aktif di Supabase.');
          }
        });
      }

      initGoogleSignIn();

      async function resumeSupabaseSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data.session) return;
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        const roleKey = profile?.role === 'Dokter' ? 'dokter' : profile?.role === 'Pasien' ? 'pasien' : 'petugas';
        window.location.href = roleKey + '.html';
      }

      resumeSupabaseSession();

      /* Tombol Google jika CLIENT_ID belum dikonfigurasi → tampilkan panduan */
      function showGoogleConfigModal() {
        const msg = [
          '🔧 Konfigurasi Google Sign-In',
          '',
          'Untuk mengaktifkan login Google, Anda perlu:',
          '',
          '1. Buka: https://console.cloud.google.com/',
          '2. Buat project baru atau pilih yang sudah ada',
          '3. Aktifkan "Google Identity Services"',
          '4. Buat OAuth 2.0 Client ID:',
          '   → APIs & Services → Credentials',
          '   → Create Credentials → OAuth 2.0 Client ID',
          '   → Application type: Web application',
          '   → Authorized origins: http://localhost:8080',
          '',
          '5. Salin Client ID, lalu buka login.html',
          '   dan ganti nilai GOOGLE_CLIENT_ID di baris konfigurasi.',
          '',
          'Format: xxxxxxxxxx.apps.googleusercontent.com',
        ].join('\n');
        alert(msg);
      }

      /* ── Remember me: restore on load ──────────────────────── */
      try {
        const saved = localStorage.getItem('simklinik_remember');
        if (saved) {
          usernameInput.value = saved;
          document.getElementById('rememberMe').checked = true;
          passwordInput.focus();
        }
      } catch {}

      /* ── Check lockout on page load ─────────────────────────── */
      checkLockout();

      /* ── Forgot password ─────────────────────────────────────── */
      document.getElementById('forgotLink').addEventListener('click', e => {
        e.preventDefault();
        alert('Silakan hubungi administrator sistem untuk reset password.\n\nEmail  : admin@simklinik.id\nTelp   : (021) 1234-5678\nJam kerja: 08.00–17.00 WIB');
      });

    })();
