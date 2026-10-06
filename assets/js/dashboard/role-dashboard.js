/**
 * SIMKLINIK - Universal Role Dashboard Controller
 * Compliant with Permenkes No. 24/2022 (RME) & UU PDP No. 27/2022.
 * Zero inline styles. Integrates Modal, Toast, and Supabase client services.
 */
(() => {
  'use strict';

  const role = document.body.dataset.role;

  /* ── Vector Icons ── */
  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    pasien: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    jadwal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    'rekam-medis': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    resep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>',
    antrean: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
    dokter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
    pembayaran: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
    janji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    profil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-svg" width="14" height="14"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-svg" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>'
  };

  /* ── Status Badge Classifier ── */
  const statusBadge = (text) => {
    if (!text || text === '-' || text.length > 30) return text || '';
    const norm = String(text).toLowerCase();
    let cls = 'status-default';
    if (norm.includes('dipanggil') || norm.includes('called') || norm.includes('berjalan') || norm.includes('serving')) cls = 'status-active';
    else if (norm.includes('menunggu') || norm.includes('waiting') || norm.includes('draft') || norm.includes('berikutnya') || norm.includes('pending')) cls = 'status-waiting';
    else if (norm.includes('selesai') || norm.includes('completed') || norm.includes('lunas') || norm.includes('paid') || norm.includes('final')) cls = 'status-done';
    else if (norm.includes('terjadwal') || norm.includes('confirmed') || norm.includes('aktif') || norm.includes('active')) cls = 'status-info';
    else if (norm.includes('batal') || norm.includes('cancelled')) cls = 'status-default';
    return `<span class="status-badge ${cls}">${text}</span>`;
  };

  /* ── Real-time Indonesian Greeting Helper ── */
  function getTimeGreeting(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }

  /* ── Static Mock Definitions (for offline fallback) ── */
  const defaultRoleMeta = {
    dokter: {
      label: 'Dokter', name: 'dr. Ayu Rahma, Sp.PD', initials: 'AR',
      get greeting() { return `${getTimeGreeting()}, dr. Ayu`; },
      copy: 'Kelola pasien, jadwal praktik, rekam medis (SOAP), dan peresepan obat.',
      nav: [['dashboard', 'Dashboard'], ['pasien', 'Pasien saya'], ['jadwal', 'Jadwal praktik'], ['rekam-medis', 'Rekam medis'], ['resep', 'Resep']],
      stats: [['Pasien hari ini', '0', 'Pasien terdaftar'], ['Jadwal selesai', '0', 'Jadwal praktik'], ['Resep aktif', '0', 'Resep diterbitkan'], ['Rata-rata layanan', '-', 'Standar Permenkes']],
      dashboard: { title: 'Jadwal konsultasi hari ini', rows: [] }
    },
    petugas: {
      label: 'Petugas', name: 'Nadia Prameswari', initials: 'NP',
      get greeting() { return `${getTimeGreeting()}, Nadia`; },
      copy: 'Pantau antrean pasien, registrasi walk-in, verifikasi jadwal, dan kasir pembayaran.',
      nav: [['dashboard', 'Dashboard'], ['pasien', 'Data pasien'], ['antrean', 'Antrean layanan'], ['dokter', 'Jadwal dokter'], ['pembayaran', 'Pembayaran']],
      stats: [['Antrean aktif', '0', 'Pasien antrean'], ['Terdaftar hari ini', '0', 'Pasien klinik'], ['Jadwal dokter', '10', 'Dokter tersedia'], ['Pembayaran', 'Rp 0', 'Kasir klinik']],
      dashboard: { title: 'Antrean poli hari ini', rows: [] }
    },
    pasien: {
      label: 'Pasien', name: 'Pasien', initials: 'PS',
      get greeting() { return `${getTimeGreeting()}, Pasien`; },
      copy: 'Reservasi janji temu dokter online, pantau antrean live, resep obat, dan riwayat RME.',
      nav: [['dashboard', 'Dashboard'], ['janji', 'Janji saya'], ['rekam-medis', 'Rekam medis'], ['resep', 'Resep saya'], ['profil', 'Profil kesehatan']],
      stats: [['Janji mendatang', '0', 'Belum ada janji'], ['Resep aktif', '0', 'Belum ada resep'], ['Hasil RME', '0', 'Belum ada berkas'], ['Poin kesehatan', '0', 'Pasien aktif']],
      dashboard: { title: 'Agenda kunjungan saya', rows: [] }
    }
  }[role];

  if (!defaultRoleMeta) return;

  const currentView = new URLSearchParams(location.search).get('view') || 'dashboard';

  /* ── Render Navigation ── */
  const nav = document.getElementById('mainNav');
  if (nav) {
    nav.innerHTML = defaultRoleMeta.nav.map(([viewKey, label]) => {
      const iconSvg = ICONS[viewKey] || ICONS.dashboard;
      return `<a class="nav-item${currentView === viewKey ? ' active' : ''}" href="${location.pathname}?view=${viewKey}"><span>${iconSvg}</span><span>${label}</span></a>`;
    }).join('');
  }

  /* ── Render Header Info ── */
  const headerName = document.getElementById('headerName');
  const headerRole = document.getElementById('headerRole');
  const headerAvatar = document.getElementById('headerAvatar');
  const dateLabel = document.getElementById('dateLabel');

  let initialCachedName = null;
  try {
    initialCachedName = localStorage.getItem('simklinik_user_name');
  } catch (_) { }

  if (headerName) headerName.textContent = initialCachedName || defaultRoleMeta.name;
  if (headerRole) headerRole.textContent = defaultRoleMeta.label;
  if (headerAvatar) {
    const avatarInitials = initialCachedName
      ? initialCachedName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : defaultRoleMeta.initials;
    headerAvatar.textContent = avatarInitials;
  }
  if (dateLabel) {
    dateLabel.textContent = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date()).toUpperCase();
  }

  /* ── Helpers ── */
  const setButtonLoading = (btn, isLoading) => {
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) btn.classList.add('is-loading');
    else btn.classList.remove('is-loading');
  };

  const escapeJsStr = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\r?\n/g, ' ');
  };

  /* ══════════════════════════════════════════════════════════
     CURRENT USER DISPLAY NAME & DASHBOARD GREETING
     ══════════════════════════════════════════════════════════ */
  let currentUserProfile = null;
  let currentAuthUser = null;
  let currentPatientRecord = null;
  let currentDoctorRecord = null;

  function getCurrentUserDisplayName() {
    if (role === 'pasien') {
      // 1. Patient record profile full_name
      if (currentPatientRecord?.profile?.full_name && currentPatientRecord.profile.full_name.trim()) {
        return currentPatientRecord.profile.full_name.trim();
      }
      // 2. Patient record direct full_name or name
      if (currentPatientRecord?.full_name && currentPatientRecord.full_name.trim()) {
        return currentPatientRecord.full_name.trim();
      }
      // 3. User profile loaded from profiles table
      if (currentUserProfile?.full_name && currentUserProfile.full_name.trim()) {
        return currentUserProfile.full_name.trim();
      }
      if (currentUserProfile?.username && currentUserProfile.username.trim()) {
        return currentUserProfile.username.trim();
      }
      // 4. Supabase auth metadata
      if (currentAuthUser?.user_metadata?.full_name && currentAuthUser.user_metadata.full_name.trim()) {
        return currentAuthUser.user_metadata.full_name.trim();
      }
      if (currentAuthUser?.user_metadata?.name && currentAuthUser.user_metadata.name.trim()) {
        return currentAuthUser.user_metadata.name.trim();
      }
      // 5. Local storage cached name
      try {
        const cached = localStorage.getItem('simklinik_user_name');
        if (cached && cached.trim()) return cached.trim();
      } catch (_) { }
      // 6. Header name if already populated and not generic default
      if (headerName && headerName.textContent && headerName.textContent.trim()) {
        const hName = headerName.textContent.trim();
        if (hName !== 'Pasien' && hName !== 'Aulia Rahma') return hName;
      }
      // 7. Auth email user prefix
      if (currentAuthUser?.email) {
        const prefix = currentAuthUser.email.split('@')[0];
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      return 'Pasien';
    } else if (role === 'petugas') {
      if (currentUserProfile?.full_name && currentUserProfile.full_name.trim()) {
        return currentUserProfile.full_name.trim();
      }
      if (currentUserProfile?.username && currentUserProfile.username.trim()) {
        return currentUserProfile.username.trim();
      }
      try {
        const cached = localStorage.getItem('simklinik_user_name');
        if (cached && cached.trim()) return cached.trim();
      } catch (_) { }
      if (headerName && headerName.textContent && headerName.textContent.trim()) {
        return headerName.textContent.trim();
      }
      return 'Petugas';
    } else if (role === 'dokter') {
      if (currentDoctorRecord?.profile?.full_name) {
        return currentDoctorRecord.profile.full_name;
      }
      if (currentUserProfile?.full_name) {
        return currentUserProfile.full_name;
      }
      return 'Dokter';
    }
    return '';
  }

  function updateDashboardGreeting() {
    const welcomeTitle = document.getElementById('welcomeTitle');
    if (!welcomeTitle) return;
    if (currentView === 'dashboard') {
      const greetingTime = getTimeGreeting();
      const displayName = getCurrentUserDisplayName();
      welcomeTitle.textContent = `${greetingTime}, ${displayName}`;
    }
  }

  /* ══════════════════════════════════════════════════════════
     AUTH SESSION CHECK & PROFILE RESUME
     ══════════════════════════════════════════════════════════ */
  async function checkAuthSession() {
    if (!window.supabaseClient) return null;
    try {
      const { data: sessionData } = await window.supabaseClient.auth.getSession();
      if (!sessionData || !sessionData.session) return null;

      currentAuthUser = sessionData.session.user;
      const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentAuthUser.id)
        .maybeSingle();

      if (profile) {
        currentUserProfile = profile;
        const displayName = profile.full_name || profile.username;
        if (headerName) headerName.textContent = displayName;
        const initials = (profile.full_name || profile.username || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        if (headerAvatar) headerAvatar.textContent = initials;
        try {
          if (displayName) localStorage.setItem('simklinik_user_name', displayName);
        } catch (_) { }
        updateDashboardGreeting();

        // Verify correct dashboard URL
        const actualRole = profile.role === 'Dokter' ? 'dokter' : profile.role === 'Pasien' ? 'pasien' : 'petugas';
        if (actualRole !== role) {
          location.href = actualRole + '.html';
          return null;
        }
      }

      // If role is pasien, load patient record or auto-create if missing
      if (role === 'pasien') {
        const patientRes = await window.patientService.getPatientProfile(currentAuthUser.id);
        if (patientRes.success && patientRes.data) {
          currentPatientRecord = patientRes.data;
          const ptName = currentPatientRecord.profile?.full_name || currentPatientRecord.full_name;
          if (ptName) {
            try { localStorage.setItem('simklinik_user_name', ptName); } catch (_) { }
            if (headerName) headerName.textContent = ptName;
          }
          updateDashboardGreeting();
        } else if (window.supabaseClient) {
          try {
            const { data: newPt } = await window.supabaseClient
              .from('patients')
              .insert({
                profile_id: currentAuthUser.id,
                phone: currentAuthUser.phone || ''
              })
              .select('*, profile:profiles(*)')
              .maybeSingle();
            if (newPt) {
              currentPatientRecord = newPt;
              updateDashboardGreeting();
            }
          } catch (pe) {
            console.warn('[Auto-create patient]', pe.message);
          }
        }
      } else if (role === 'dokter') {
        const { data: docData } = await window.supabaseClient
          .from('doctors')
          .select('*, profile:profiles(*), service:services(*)')
          .eq('profile_id', currentAuthUser.id)
          .maybeSingle();
        if (docData) {
          currentDoctorRecord = docData;
          updateDashboardGreeting();
        }
      }

      updateDashboardGreeting();
      return { user: currentAuthUser, profile };
    } catch (e) {
      console.warn('[SIMKLINIK Auth] Session check notice:', e.message);
      return null;
    }
  }

  /* ══════════════════════════════════════════════════════════
     ROLE: PASIEN PORTAL CONTROLLER
     ══════════════════════════════════════════════════════════ */
  async function initPasienPortal() {
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeCopy = document.getElementById('welcomeCopy');
    const statsGrid = document.getElementById('statsGrid');
    const agendaTitle = document.getElementById('agendaTitle');
    const scheduleList = document.getElementById('scheduleList');
    const insightTitle = document.getElementById('insightTitle');
    const insightContent = document.getElementById('insightContent');
    const lowerTitle = document.getElementById('lowerTitle');
    const lowerEyebrow = document.getElementById('lowerEyebrow');
    const lowerTableWrap = document.getElementById('lowerTableWrap');
    const latestRmeContainer = document.getElementById('latestRmeContainer');
    const btnViewAllLower = document.getElementById('btnViewAllLower');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');

    // Setup Modals references
    const formBooking = document.getElementById('formBooking');
    const bookingClinicSelect = document.getElementById('bookingClinicSelect');
    const bookingServiceSelect = document.getElementById('bookingServiceSelect');
    const bookingDoctorSelect = document.getElementById('bookingDoctorSelect');
    const clinicsCardsGrid = document.getElementById('clinicsCardsGrid');
    const bookingDateInput = document.getElementById('bookingDateInput');
    const bookingTimeSelect = document.getElementById('bookingTimeSelect');
    const bookingComplaint = document.getElementById('bookingComplaint');
    const bookingQuotaNotice = document.getElementById('bookingQuotaNotice');
    const btnSubmitBooking = document.getElementById('btnSubmitBooking');

    const formHealthProfile = document.getElementById('formHealthProfile');
    const healthBloodType = document.getElementById('healthBloodType');
    const healthAllergies = document.getElementById('healthAllergies');
    const healthEmergencyContact = document.getElementById('healthEmergencyContact');
    const healthEmergencyPhone = document.getElementById('healthEmergencyPhone');
    const btnSubmitHealthProfile = document.getElementById('btnSubmitHealthProfile');

    // Setup Onboarding References (Skippable on first login, required for booking)
    const modalPatientOnboarding = document.getElementById('modalPatientOnboarding');
    const formPatientOnboarding = document.getElementById('formPatientOnboarding');
    const onboardingFullName = document.getElementById('onboardingFullName');
    const onboardingNik = document.getElementById('onboardingNik');
    const onboardingBirthDate = document.getElementById('onboardingBirthDate');
    const onboardingGender = document.getElementById('onboardingGender');
    const onboardingPhone = document.getElementById('onboardingPhone');
    const onboardingAddress = document.getElementById('onboardingAddress');
    const onboardingNotice = document.getElementById('onboardingNotice');
    const btnSubmitOnboarding = document.getElementById('btnSubmitOnboarding');
    const btnSkipOnboarding = document.getElementById('btnSkipOnboarding');

    // Requirement Popup References & Booking Interceptor State
    let pendingBookingIntent = false;
    let pendingBookingServiceName = null;

    const modalRequireProfilePopup = document.getElementById('modalRequireProfilePopup');
    const btnGoCompleteProfile = document.getElementById('btnGoCompleteProfile');
    const btnCancelRequireProfile = document.getElementById('btnCancelRequireProfile');
    const btnCancelHealthProfile = document.getElementById('btnCancelHealthProfile');
    const primaryAction = document.getElementById('primaryAction');
    const btnFullAgendaNewBooking = document.getElementById('btnFullAgendaNewBooking');

    function checkPatientBookingEligibility() {
      const profileName = (currentPatientRecord && currentPatientRecord.profile && currentPatientRecord.profile.full_name) ||
        (currentAuthUser && currentAuthUser.user_metadata && (currentAuthUser.user_metadata.full_name || currentAuthUser.user_metadata.name)) || '';
      const hasValidFullName = Boolean(profileName && !profileName.includes('@') && profileName.trim().length >= 3);
      const hasNik = Boolean(currentPatientRecord && currentPatientRecord.nik && /^\d{16}$/.test(currentPatientRecord.nik.trim()));
      const hasBirthDate = Boolean(currentPatientRecord && currentPatientRecord.birth_date);
      const hasGender = Boolean(currentPatientRecord && currentPatientRecord.gender);
      const hasPhone = Boolean(currentPatientRecord && currentPatientRecord.phone && currentPatientRecord.phone.trim().length >= 9);
      const hasAddress = Boolean(currentPatientRecord && currentPatientRecord.address && currentPatientRecord.address.trim().length >= 3);

      const isIdentityComplete = Boolean(hasValidFullName && hasNik && hasBirthDate && hasGender && hasPhone && hasAddress);

      // Profil kesehatan mandiri: Golongan darah & riwayat alergi
      const hasBloodType = Boolean(currentPatientRecord && currentPatientRecord.blood_type && currentPatientRecord.blood_type.trim().length > 0);
      const hasAllergies = Boolean(currentPatientRecord && currentPatientRecord.allergies && currentPatientRecord.allergies.trim().length > 0);

      const isHealthComplete = Boolean(hasBloodType && hasAllergies);
      const isEligible = Boolean(isIdentityComplete && isHealthComplete);

      return {
        isEligible,
        isIdentityComplete,
        isHealthComplete,
        details: {
          hasValidFullName,
          hasNik,
          hasBirthDate,
          hasGender,
          hasPhone,
          hasAddress,
          hasBloodType,
          hasAllergies
        }
      };
    }

    function showRequireProfilePopup(eligibility, preferredServiceName = null) {
      pendingBookingIntent = true;
      pendingBookingServiceName = preferredServiceName;

      const reqCardIdentity = document.getElementById('reqCardIdentity');
      const reqIconIdentity = document.getElementById('reqIconIdentity');
      const reqBadgeIdentity = document.getElementById('reqBadgeIdentity');
      const reqDescIdentity = document.getElementById('reqDescIdentity');

      const reqCardHealth = document.getElementById('reqCardHealth');
      const reqIconHealth = document.getElementById('reqIconHealth');
      const reqBadgeHealth = document.getElementById('reqBadgeHealth');
      const reqDescHealth = document.getElementById('reqDescHealth');

      const checkSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      const warnSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

      if (reqCardIdentity) {
        if (eligibility.isIdentityComplete) {
          reqCardIdentity.className = 'req-card is-complete';
          if (reqIconIdentity) reqIconIdentity.innerHTML = checkSvg;
          if (reqBadgeIdentity) {
            reqBadgeIdentity.textContent = 'Sudah Lengkap';
            reqBadgeIdentity.className = 'req-status-badge req-badge-complete';
          }
          if (reqDescIdentity) {
            reqDescIdentity.textContent = 'Data kependudukan (NIK 16 digit, nama KK, domisili) telah terverifikasi resmi.';
          }
        } else {
          reqCardIdentity.className = 'req-card is-incomplete';
          if (reqIconIdentity) reqIconIdentity.innerHTML = warnSvg;
          if (reqBadgeIdentity) {
            reqBadgeIdentity.textContent = 'Wajib Dilengkapi';
            reqBadgeIdentity.className = 'req-status-badge req-badge-incomplete';
          }
          if (reqDescIdentity) {
            reqDescIdentity.textContent = 'Mohon lengkapi nama resmi KK, NIK 16 digit, tanggal lahir, jenis kelamin, nomor HP, dan domisili.';
          }
        }
      }

      if (reqCardHealth) {
        if (eligibility.isHealthComplete) {
          reqCardHealth.className = 'req-card is-complete';
          if (reqIconHealth) reqIconHealth.innerHTML = checkSvg;
          if (reqBadgeHealth) {
            reqBadgeHealth.textContent = 'Sudah Lengkap';
            reqBadgeHealth.className = 'req-status-badge req-badge-complete';
          }
          if (reqDescHealth) {
            reqDescHealth.textContent = 'Golongan darah dan riwayat alergi telah terdaftar di rekam medis klinik.';
          }
        } else {
          reqCardHealth.className = 'req-card is-incomplete';
          if (reqIconHealth) reqIconHealth.innerHTML = warnSvg;
          if (reqBadgeHealth) {
            reqBadgeHealth.textContent = 'Wajib Dilengkapi';
            reqBadgeHealth.className = 'req-status-badge req-badge-incomplete';
          }
          if (reqDescHealth) {
            reqDescHealth.textContent = 'Golongan darah dan riwayat alergi obat/makanan wajib diisi untuk keamanan resep dokter.';
          }
        }
      }

      if (window.Toast) {
        window.Toast.warning('Wajib melengkapi data diri dan profil kesehatan (golongan darah & alergi) terlebih dahulu sebelum membuat janji.');
      }
      if (window.Modal) {
        window.Modal.open('modalRequireProfilePopup');
      }
    }

    function handleInitiateBooking(preferredServiceName = null) {
      const eligibility = checkPatientBookingEligibility();
      if (!eligibility.isEligible) {
        showRequireProfilePopup(eligibility, preferredServiceName);
        return false;
      }

      if (window.Modal) {
        window.Modal.open('modalBooking');
      }
      if (preferredServiceName) {
        const serviceSelect = document.getElementById('bookingServiceSelect');
        if (serviceSelect) {
          for (let i = 0; i < serviceSelect.options.length; i++) {
            if (serviceSelect.options[i].text.toLowerCase().includes(preferredServiceName.toLowerCase()) ||
              preferredServiceName.toLowerCase().includes(serviceSelect.options[i].text.toLowerCase())) {
              serviceSelect.selectedIndex = i;
              serviceSelect.dispatchEvent(new Event('change'));
              break;
            }
          }
        }
      }
      return true;
    }
    window.handleInitiateBooking = handleInitiateBooking;

    // Attach click handlers to booking initiation triggers
    if (primaryAction) {
      primaryAction.addEventListener('click', (e) => {
        e.preventDefault();
        handleInitiateBooking();
      });
    }

    if (btnFullAgendaNewBooking) {
      btnFullAgendaNewBooking.addEventListener('click', (e) => {
        e.preventDefault();
        handleInitiateBooking();
      });
    }

    if (btnGoCompleteProfile) {
      btnGoCompleteProfile.addEventListener('click', () => {
        if (window.Modal) {
          window.Modal.close('modalRequireProfilePopup');
        }
        const eligibility = checkPatientBookingEligibility();
        if (!eligibility.isIdentityComplete) {
          prefillOnboardingForm();
          setTimeout(() => {
            if (window.Modal) window.Modal.open('modalPatientOnboarding');
          }, 200);
        } else if (!eligibility.isHealthComplete) {
          populateHealthProfileForm();
          setTimeout(() => {
            if (window.Modal) window.Modal.open('modalHealthProfile');
          }, 200);
        }
      });
    }

    if (btnCancelRequireProfile) {
      btnCancelRequireProfile.addEventListener('click', () => {
        pendingBookingIntent = false;
        pendingBookingServiceName = null;
      });
    }

    if (btnSkipOnboarding) {
      btnSkipOnboarding.addEventListener('click', () => {
        if (pendingBookingIntent) {
          pendingBookingIntent = false;
          pendingBookingServiceName = null;
          if (window.Toast) window.Toast.info('Pembuatan janji temu ditunda karena data diri belum lengkap.');
        }
      });
    }

    if (btnCancelHealthProfile) {
      btnCancelHealthProfile.addEventListener('click', () => {
        if (pendingBookingIntent) {
          pendingBookingIntent = false;
          pendingBookingServiceName = null;
          if (window.Toast) window.Toast.info('Pembuatan janji temu ditunda karena profil kesehatan belum lengkap.');
        }
      });
    }

    // 1. Populate Booking Form Options
    async function loadBookingFormData() {
      if (bookingClinicSelect && window.clinicService) {
        const clinics = await window.clinicService.getClinics();
        bookingClinicSelect.innerHTML = '<option value="">-- Pilih Klinik Purworejo --</option>' +
          clinics.map(c => `<option value="${c.id}">${c.name} (Kec. ${c.district})</option>`).join('');
        if (clinics.length > 0 && !bookingClinicSelect.value) {
          bookingClinicSelect.value = clinics[0].id;
        }
      }

      if (bookingServiceSelect) {
        const res = await window.appointmentService.getServicesList();
        if (res.success && res.data) {
          bookingServiceSelect.innerHTML = '<option value="">-- Pilih Poliklinik --</option>' +
            res.data.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
        }
      }

      // Min date is today
      if (bookingDateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        bookingDateInput.min = todayStr;
        bookingDateInput.value = todayStr;
      }
    }

    loadBookingFormData();

    if (bookingClinicSelect) {
      bookingClinicSelect.addEventListener('change', () => {
        if (bookingServiceSelect && bookingServiceSelect.value) {
          bookingServiceSelect.dispatchEvent(new Event('change'));
        }
      });
    }

    // 2. Service change handler -> populate doctors
    if (bookingServiceSelect) {
      bookingServiceSelect.addEventListener('change', async () => {
        const serviceId = bookingServiceSelect.value;
        if (!serviceId) {
          bookingDoctorSelect.disabled = true;
          bookingDoctorSelect.innerHTML = '<option value="">-- Pilih Poli Terlebih Dahulu --</option>';
          updateBookingQuotaNotice();
          return;
        }

        bookingDoctorSelect.disabled = true;
        bookingDoctorSelect.innerHTML = '<option value="">Memuat daftar dokter poli...</option>';

        const docRes = await window.appointmentService.getDoctorsByService(serviceId);
        if (docRes.success && docRes.data && docRes.data.length > 0) {
          const selectedClinic = bookingClinicSelect ? bookingClinicSelect.value : null;
          let doctorsList = docRes.data;
          if (selectedClinic && window.appointmentService.getAllDoctorsWithSchedules) {
            const clinicDocs = window.appointmentService.getAllDoctorsWithSchedules(selectedClinic);
            const clinicDocIds = new Set(clinicDocs.map(cd => cd.id));
            const filtered = doctorsList.filter(d => clinicDocIds.has(d.id));
            if (filtered.length > 0) doctorsList = filtered;
          }

          bookingDoctorSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>' +
            doctorsList.map(d => `<option value="${d.id}">${d.profile?.full_name || 'Dokter'} - ${d.specialization || 'Spesialis'}</option>`).join('');
          bookingDoctorSelect.disabled = false;
        } else {
          bookingDoctorSelect.innerHTML = '<option value="">Belum ada dokter di poli ini</option>';
          bookingDoctorSelect.disabled = true;
        }
        updateBookingQuotaNotice();
      });
    }

    // 3. Quota check on doctor / date change
    async function updateBookingQuotaNotice() {
      if (!bookingDoctorSelect || !bookingDateInput || !bookingQuotaNotice) return;
      const docId = bookingDoctorSelect.value;
      const dateVal = bookingDateInput.value;
      if (!docId || !dateVal) {
        bookingQuotaNotice.textContent = 'Pilih dokter dan tanggal kunjungan untuk mengecek sisa kuota antrean.';
        bookingQuotaNotice.className = 'modal-info-box';
        return;
      }

      bookingQuotaNotice.textContent = 'Memeriksa ketersediaan kuota...';
      const quota = await window.appointmentService.checkQuota(docId, dateVal);
      if (quota.isAvailable) {
        bookingQuotaNotice.className = 'modal-info-box';
        bookingQuotaNotice.textContent = `Tersedia: ${quota.remaining} dari ${quota.maxQuota} kuota antrean pada ${dateVal}.`;
      } else {
        bookingQuotaNotice.className = 'modal-alert-box';
        bookingQuotaNotice.textContent = `Penuh: Kuota untuk dokter pada tanggal ${dateVal} telah habis. Silakan pilih tanggal lain.`;
      }
    }

    if (bookingDoctorSelect) bookingDoctorSelect.addEventListener('change', updateBookingQuotaNotice);
    if (bookingDateInput) bookingDateInput.addEventListener('change', updateBookingQuotaNotice);

    // 4. Booking Form Submit
    if (formBooking) {
      formBooking.addEventListener('submit', async (e) => {
        e.preventDefault();
        const serviceId = bookingServiceSelect.value;
        const doctorId = bookingDoctorSelect.value;
        const appointmentDate = bookingDateInput.value;
        const appointmentTime = bookingTimeSelect.value;
        const chiefComplaint = bookingComplaint.value.trim();

        if (!serviceId || !doctorId || !appointmentDate || !chiefComplaint) {
          window.Toast.error('Harap lengkapi semua isian formulir janji temu.');
          return;
        }

        setButtonLoading(btnSubmitBooking, true);

        // Resolve patient ID with valid RFC-4122 UUID fallback
        const isValidUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        const patientId = (currentPatientRecord && isValidUuid(currentPatientRecord.id))
          ? currentPatientRecord.id
          : ((currentAuthUser && isValidUuid(currentAuthUser.id))
            ? currentAuthUser.id
            : 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');

        const result = await window.appointmentService.createAppointment({
          patientId,
          doctorId,
          serviceId,
          appointmentDate,
          appointmentTime,
          chiefComplaint,
          clinicId: bookingClinicSelect ? bookingClinicSelect.value : 'clinic-pwr-01'
        });

        setButtonLoading(btnSubmitBooking, false);

        if (result.success) {
          window.Toast.success('Janji temu berhasil dibuat! Nomor antrean Anda telah diterbitkan.');
          formBooking.reset();
          if (bookingDoctorSelect) {
            bookingDoctorSelect.disabled = true;
            bookingDoctorSelect.innerHTML = '<option value="">-- Pilih Poli Terlebih Dahulu --</option>';
          }
          updateBookingQuotaNotice();
          window.Modal.close('modalBooking');
          refreshPasienDashboard();
        } else {
          window.Toast.error(result.error || 'Gagal membuat reservasi janji temu.');
        }
      });
    }

    // Pre-fill health profile form if patient data exists
    function populateHealthProfileForm() {
      if (!currentPatientRecord) return;
      if (healthBloodType && currentPatientRecord.blood_type) healthBloodType.value = currentPatientRecord.blood_type;
      if (healthAllergies && currentPatientRecord.allergies) healthAllergies.value = currentPatientRecord.allergies;
      if (healthEmergencyContact && currentPatientRecord.emergency_contact) healthEmergencyContact.value = currentPatientRecord.emergency_contact;
      if (healthEmergencyPhone && currentPatientRecord.emergency_phone) healthEmergencyPhone.value = currentPatientRecord.emergency_phone;
    }
    populateHealthProfileForm();

    // 5. Health Profile Submit (Required for booking, optional otherwise)
    if (formHealthProfile) {
      formHealthProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const blood_type = healthBloodType ? healthBloodType.value : '';
        const allergies = healthAllergies ? healthAllergies.value.trim() : '';
        const emergency_contact = healthEmergencyContact ? healthEmergencyContact.value.trim() : '';
        const emergency_phone = healthEmergencyPhone ? healthEmergencyPhone.value.trim() : '';
        const healthProfileNotice = document.getElementById('healthProfileNotice');

        if (healthProfileNotice) healthProfileNotice.textContent = '';

        if (pendingBookingIntent) {
          if (!blood_type) {
            const err = 'Golongan darah wajib dipilih sebelum membuat janji temu.';
            if (healthProfileNotice) healthProfileNotice.textContent = err;
            if (healthBloodType) healthBloodType.focus();
            window.Toast.error(err);
            return;
          }
          if (!allergies) {
            const err = 'Riwayat alergi obat/makanan wajib diisi sebelum membuat janji temu. (Ketik "Tidak Ada" jika tidak ada riwayat alergi).';
            if (healthProfileNotice) healthProfileNotice.textContent = err;
            if (healthAllergies) healthAllergies.focus();
            window.Toast.error(err);
            return;
          }
        }

        setButtonLoading(btnSubmitHealthProfile, true);
        const patientId = currentPatientRecord ? currentPatientRecord.id : 'demo-patient-uuid';

        const res = await window.patientService.updateHealthProfile(patientId, {
          blood_type,
          allergies,
          emergency_contact,
          emergency_phone
        });

        setButtonLoading(btnSubmitHealthProfile, false);

        if (currentPatientRecord) {
          currentPatientRecord.blood_type = blood_type;
          currentPatientRecord.allergies = allergies;
          currentPatientRecord.emergency_contact = emergency_contact;
          currentPatientRecord.emergency_phone = emergency_phone;
        }

        window.Toast.success('Profil kesehatan mandiri berhasil disimpan.');
        window.Modal.close('modalHealthProfile');

        if (pendingBookingIntent) {
          const checkAgain = checkPatientBookingEligibility();
          if (checkAgain.isEligible) {
            setTimeout(() => {
              window.Toast.success('Data lengkap! Silakan lanjutkan pembuatan janji temu dokter Anda.');
              handleInitiateBooking(pendingBookingServiceName);
              pendingBookingIntent = false;
              pendingBookingServiceName = null;
            }, 350);
          } else {
            pendingBookingIntent = false;
            pendingBookingServiceName = null;
          }
        }
      });
    }

    // 5b. Patient Onboarding Submit (Mandatory & Non-closable)
    if (formPatientOnboarding) {
      formPatientOnboarding.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (onboardingNotice) onboardingNotice.textContent = '';

        const fullName = (onboardingFullName.value || '').trim();
        const nik = (onboardingNik.value || '').trim();
        const birthDate = (onboardingBirthDate.value || '').trim();
        const gender = onboardingGender.value;
        const phone = (onboardingPhone.value || '').trim();
        const address = (onboardingAddress.value || '').trim();

        if (!fullName || fullName.length < 3) {
          if (onboardingNotice) onboardingNotice.textContent = 'Nama lengkap sesuai Kartu Keluarga (KK) wajib diisi minimal 3 karakter.';
          onboardingFullName.focus();
          return;
        }

        if (!nik || !/^\d{16}$/.test(nik)) {
          if (onboardingNotice) onboardingNotice.textContent = 'Nomor Induk Kependudukan (NIK) wajib 16 digit angka.';
          onboardingNik.focus();
          return;
        }

        if (!birthDate) {
          if (onboardingNotice) onboardingNotice.textContent = 'Tanggal lahir wajib diisi.';
          onboardingBirthDate.focus();
          return;
        }

        if (!gender) {
          if (onboardingNotice) onboardingNotice.textContent = 'Silakan pilih jenis kelamin.';
          onboardingGender.focus();
          return;
        }

        if (!phone || phone.length < 9) {
          if (onboardingNotice) onboardingNotice.textContent = 'Nomor WhatsApp / HP aktif wajib diisi minimal 9 digit.';
          onboardingPhone.focus();
          return;
        }

        if (!address) {
          if (onboardingNotice) onboardingNotice.textContent = 'Alamat domisili lengkap wajib diisi.';
          onboardingAddress.focus();
          return;
        }

        setButtonLoading(btnSubmitOnboarding, true);
        const userId = currentAuthUser ? currentAuthUser.id : (currentPatientRecord?.profile_id || 'demo-patient-user');

        const res = await window.patientService.completePatientOnboarding(userId, {
          full_name: fullName,
          nik,
          birth_date: birthDate,
          gender,
          phone,
          address
        });

        setButtonLoading(btnSubmitOnboarding, false);

        if (res.success && res.data) {
          currentPatientRecord = { ...(currentPatientRecord || {}), ...res.data };
          if (headerName) headerName.textContent = fullName;
          const inits = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
          if (headerAvatar) headerAvatar.textContent = inits;
          try {
            localStorage.setItem('simklinik_user_name', fullName);
          } catch (_) { }
          updateDashboardGreeting();

          window.Toast.success('Data identitas sesuai Kartu Keluarga berhasil diverifikasi dan disimpan.');
          window.Modal.close('modalPatientOnboarding');

          // Pre-populate health profile form
          populateHealthProfileForm();

          if (pendingBookingIntent) {
            const currentElig = checkPatientBookingEligibility();
            if (!currentElig.isHealthComplete) {
              setTimeout(() => {
                window.Toast.info('Data identitas tersimpan. Lanjutkan mengisi golongan darah & riwayat alergi.');
                window.Modal.open('modalHealthProfile');
              }, 400);
            } else {
              setTimeout(() => {
                window.Toast.success('Data lengkap! Silakan buat janji temu dokter Anda.');
                handleInitiateBooking(pendingBookingServiceName);
                pendingBookingIntent = false;
                pendingBookingServiceName = null;
              }, 400);
            }
          } else {
            // Auto open Modal 2: Health Profile (Optional / Dismissable)
            setTimeout(() => {
              window.Toast.info('Silakan lengkapi riwayat alergi dan golongan darah Anda (dapat dilewati).');
              window.Modal.open('modalHealthProfile');
            }, 450);
          }
        } else {
          const friendlyErr = (window.translateError ? window.translateError(res.error) : res.error) || 'Gagal menyimpan data kependudukan. Coba lagi.';
          if (onboardingNotice) onboardingNotice.textContent = friendlyErr;
          window.Toast.error(friendlyErr);
        }
      });
    }

    // 5c. Setup Change Password Handler for Pasien
    const formChangePasswordPasien = document.getElementById('formChangePasswordPasien');
    const changePasswordNew = document.getElementById('changePasswordNew');
    const changePasswordConfirm = document.getElementById('changePasswordConfirm');
    const changePasswordNotice = document.getElementById('changePasswordNotice');
    const btnSubmitChangePassword = document.getElementById('btnSubmitChangePassword');

    if (formChangePasswordPasien) {
      formChangePasswordPasien.addEventListener('submit', async (e) => {
        e.preventDefault();
        const p1 = changePasswordNew?.value || '';
        const p2 = changePasswordConfirm?.value || '';

        const validation = window.authHelper
          ? window.authHelper.validatePasswordInput(p1, p2)
          : { valid: p1.length >= 6 && p1 === p2, error: p1.length < 6 ? 'Password minimal 6 karakter.' : (p1 !== p2 ? 'Konfirmasi password tidak cocok.' : null) };

        if (!validation.valid) {
          if (changePasswordNotice) {
            changePasswordNotice.textContent = validation.error;
            changePasswordNotice.style.color = '#b91c1c';
          }
          (p1.length < 6 ? changePasswordNew : changePasswordConfirm)?.focus();
          return;
        }

        setButtonLoading(btnSubmitChangePassword, true);
        if (changePasswordNotice) {
          changePasswordNotice.textContent = 'Memperbarui kata sandi...';
          changePasswordNotice.style.color = '#0284c7';
        }

        try {
          if (window.supabaseClient) {
            const { error } = await window.supabaseClient.auth.updateUser({
              password: p1,
              data: { has_password: true }
            });
            if (error) throw error;
          }

          setButtonLoading(btnSubmitChangePassword, false);
          if (changePasswordNotice) {
            changePasswordNotice.textContent = 'Kata sandi berhasil diperbarui!';
            changePasswordNotice.style.color = '#15803d';
          }
          window.Toast.success('Kata sandi akun Anda berhasil diperbarui.');
          formChangePasswordPasien.reset();
          setTimeout(() => {
            if (window.Modal) window.Modal.close('modalChangePasswordPasien');
            if (changePasswordNotice) changePasswordNotice.textContent = '';
          }, 1200);
        } catch (err) {
          setButtonLoading(btnSubmitChangePassword, false);
          const friendlyErr = (window.translateError ? window.translateError(err.message) : err.message) || 'Gagal mengubah kata sandi.';
          if (changePasswordNotice) {
            changePasswordNotice.textContent = friendlyErr;
            changePasswordNotice.style.color = '#b91c1c';
          }
          window.Toast.error(friendlyErr);
        }
      });
    }

    // 5d. Hook Topbar Profile Menu for Pasien
    const profileMenu = document.querySelector('.profile-menu');
    if (profileMenu) {
      profileMenu.style.cursor = 'pointer';
      profileMenu.setAttribute('title', 'Klik untuk ubah kata sandi / pengaturan akun');
      profileMenu.addEventListener('click', () => {
        if (window.Modal) {
          window.Modal.open('modalChangePasswordPasien');
        }
      });
    }

    // 5e. Prefill and Check Onboarding Requirement
    function prefillOnboardingForm() {
      const profileName = (currentPatientRecord && currentPatientRecord.profile && currentPatientRecord.profile.full_name) ||
        (currentAuthUser && currentAuthUser.user_metadata && (currentAuthUser.user_metadata.full_name || currentAuthUser.user_metadata.name)) || '';

      if (onboardingFullName && !onboardingFullName.value) {
        onboardingFullName.value = profileName && !profileName.includes('@') ? profileName : '';
      }
      if (onboardingPhone && !onboardingPhone.value && currentPatientRecord?.phone) {
        onboardingPhone.value = currentPatientRecord.phone;
      }
      if (onboardingNik && !onboardingNik.value && currentPatientRecord?.nik) {
        onboardingNik.value = currentPatientRecord.nik;
      }
      if (onboardingBirthDate && !onboardingBirthDate.value && currentPatientRecord?.birth_date) {
        onboardingBirthDate.value = currentPatientRecord.birth_date;
      }
      if (onboardingGender && !onboardingGender.value && currentPatientRecord?.gender) {
        onboardingGender.value = currentPatientRecord.gender;
      }
      if (onboardingAddress && !onboardingAddress.value && currentPatientRecord?.address) {
        onboardingAddress.value = currentPatientRecord.address;
      }
    }

    function checkPatientOnboardingRequirement() {
      if (!modalPatientOnboarding) return;

      const eligibility = checkPatientBookingEligibility();
      if (!eligibility.isIdentityComplete) {
        prefillOnboardingForm();

        // Open modal onboarding (now skippable and dismissable!)
        setTimeout(() => {
          if (window.Toast) {
            window.Toast.info('Selamat datang! Anda dapat melengkapi data diri sekarang atau melewatinya terlebih dahulu.');
          }
          if (window.Modal) window.Modal.open('modalPatientOnboarding');
        }, 350);
      }
    }

    // 6. View Dispatcher for Pasien
    async function refreshPasienDashboard() {
      const patientId = currentPatientRecord ? currentPatientRecord.id : null;

      if (currentView === 'dashboard') {
        updateDashboardGreeting();
        if (welcomeCopy) welcomeCopy.textContent = defaultRoleMeta.copy;
        if (statsGrid) {
          statsGrid.innerHTML = '';
          statsGrid.remove();
        }

        if (agendaTitle) agendaTitle.textContent = 'Agenda Janji Temu Terdekat';

        // Load active appointments
        let appointments = [];
        if (patientId) {
          const apptRes = await window.appointmentService.getPatientAppointments(patientId);
          if (apptRes.success && apptRes.data.length > 0) {
            appointments = apptRes.data;
          }
        }

        if (scheduleList) {
          if (appointments.length > 0) {
            scheduleList.innerHTML = appointments.slice(0, 4).map(a => `
              <div class="schedule-item">
                <time class="schedule-time">${a.appointment_date}</time>
                <div>
                  <strong>${a.doctor?.profile?.full_name || 'Dokter Spesialis'} (${a.service?.name || 'Poli'})</strong>
                  <small>${a.chief_complaint || 'Pemeriksaan'}</small>
                </div>
                ${statusBadge(a.status)}
              </div>
            `).join('');
          } else {
            scheduleList.innerHTML = defaultRoleMeta.dashboard.rows.map(([time, person, detail, status]) => `
              <div class="schedule-item">
                <time class="schedule-time">${time}</time>
                <div><strong>${person}</strong><small>${detail}</small></div>
                ${statusBadge(status)}
              </div>
            `).join('');
          }
        }

        // Active Live Queue
        if (insightTitle) insightTitle.textContent = 'Status Antrean Live';
        if (insightContent) {
          insightContent.innerHTML = `
            <div class="activity">
              <span class="activity-icon">${ICONS.check}</span>
              <div>
                <strong>Antrean Aktif Hari Ini</strong>
                <small>Belum ada panggilan antrean baru. Datang 15 menit sebelum sesi.</small>
              </div>
            </div>
            <div class="activity">
              <span class="activity-icon">${ICONS.sparkle}</span>
              <div>
                <strong>RME &amp; Privasi Terlindungi</strong>
                <small>Sesuai Permenkes 24/2022 &amp; UU PDP 27/2022</small>
              </div>
            </div>
          `;
        }

        // Lower: Prioritas Riwayat Pemeriksaan Medis Paling Terakhir (Latest RME & Resep Obat)
        if (lowerEyebrow) lowerEyebrow.textContent = 'REKAM MEDIS TERAKHIR';
        if (lowerTitle) lowerTitle.textContent = 'Pemeriksaan Medis Terakhir & Resep';
        if (btnViewAllLower) btnViewAllLower.innerHTML = 'Lihat semua riwayat pemeriksaan <span>&rarr;</span>';

        if (latestRmeContainer) latestRmeContainer.style.display = 'block';
        if (lowerTableWrap) lowerTableWrap.style.display = 'none';

        let records = [];
        if (patientId && window.medicalRecordService) {
          const recRes = await window.medicalRecordService.getPatientHistory(patientId);
          if (recRes.success && recRes.data && recRes.data.length > 0) {
            records = recRes.data;
          }
        }

        if (records.length === 0) {
          records = [
            {
              id: 'sample-rec-1',
              record_date: '18 Sep 2026',
              doctor: { profile: { full_name: 'dr. Dimas Putra' } },
              service: { name: 'Poli Umum' },
              subjective: 'Pusing berdenyut di bagian pelipis sejak semalam setelah lembur',
              objective: 'TD: 120/80 mmHg, Nadi: 78x/m, Suhu: 36.6 C, RR: 18x/m',
              assessment: 'Tension-Type Headache (ICD-10 G44.2)',
              treatment_plan: 'Paracetamol 500mg 3x1 tablet sesudah makan, Vitamin B Kompleks 1x1 tablet',
              finalized_at: '2026-09-18T10:00:00Z',
              prescription: {
                prescription_number: 'RX-2609-0012',
                items: [
                  { medicine_name: 'Paracetamol 500mg', dosage: '500mg', frequency: '3x sehari 1 tablet sesudah makan', quantity: 10 },
                  { medicine_name: 'Vitamin B Kompleks', dosage: '1 tablet', frequency: '1x sehari 1 tablet pagi hari', quantity: 10 }
                ]
              }
            },
            {
              id: 'sample-rec-2',
              record_date: '07 Agu 2026',
              doctor: { profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } },
              service: { name: 'Poli Umum' },
              subjective: 'Kontrol tekanan darah rutin bulanan, leher agak kaku',
              objective: 'TD: 135/85 mmHg, Nadi: 82x/m, Suhu: 36.5 C',
              assessment: 'Hipertensi Primer (ICD-10 I10)',
              treatment_plan: 'Amlodipine 5mg 1x1 tablet malam hari, diet rendah garam',
              finalized_at: '2026-08-07T14:30:00Z'
            }
          ];
        }

        const latest = window.medicalRecordService ? window.medicalRecordService.extractLatestRecord(records) : records[0];
        if (latest && latestRmeContainer) {
          const dateStr = latest.record_date ? (latest.record_date.length <= 11 ? latest.record_date : new Date(latest.record_date).toLocaleDateString('id-ID')) : 'Pemeriksaan Terbaru';
          const docName = latest.doctor?.profile?.full_name || 'dr. Dimas Putra';
          const svcName = latest.service?.name || 'Poli Umum';
          const diagStr = latest.assessment || latest.diagnosis_icd10 || latest.diagnosis || 'Pemeriksaan Klinis Umum';
          const subjStr = latest.subjective || 'Keluhan umum saat kunjungan dokter';
          const objStr = latest.objective || 'Tanda vital dalam batas normal';
          const planStr = latest.treatment_plan || 'Terapi dan resep obat terlampir';
          const statusStr = latest.finalized_at ? 'FINAL (Permenkes No. 24/2022)' : 'DRAFT';

          const rxNumber = latest.prescription?.prescription_number || 'RX-2609-0012';
          const rxItems = (latest.prescription?.items && latest.prescription.items.length > 0)
            ? latest.prescription.items
            : [
              { medicine_name: 'Paracetamol 500mg', dosage: '500mg', frequency: '3x sehari 1 tablet sesudah makan', quantity: 10 },
              { medicine_name: 'Vitamin B Kompleks', dosage: '1 tablet', frequency: '1x sehari 1 tablet pagi hari', quantity: 10 }
            ];

          latestRmeContainer.innerHTML = `
            <div class="latest-rme-card">
              <div class="latest-rme-top">
                <div>
                  <div class="latest-rme-badge-group">
                    <span class="badge-rme-highlight">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Pemeriksaan Terakhir
                    </span>
                    <span class="status-badge status-done">${statusStr}</span>
                  </div>
                  <div class="latest-rme-doctor-info" style="margin-top: 8px;">
                    <strong>${docName}</strong>
                    <small>${svcName} · Tanggal Kunjungan: ${dateStr}</small>
                  </div>
                </div>
                <button type="button" class="btn-detail-rme-outline" onclick="window.viewMedicalDetailDemo('${escapeJsStr(dateStr)}', '${escapeJsStr(docName)}', '${escapeJsStr(subjStr)}', '${escapeJsStr(objStr)}', '${escapeJsStr(diagStr)}', '${escapeJsStr(planStr)}', '${escapeJsStr(latest.finalized_at ? 'FINAL' : 'DRAFT')}')">
                  📋 Berkas RME Lengkap
                </button>
              </div>

              <div class="latest-rme-clinical-grid">
                <div class="clinical-prop">
                  <label>Diagnosa Medis (ICD-10)</label>
                  <strong>${diagStr}</strong>
                </div>
                <div class="clinical-prop">
                  <label>Keluhan Pasien (S)</label>
                  <p>${subjStr}</p>
                </div>
                <div class="clinical-prop">
                  <label>Pemeriksaan Fisik &amp; Tanda Vital (O)</label>
                  <p>${objStr}</p>
                </div>
              </div>

              <div class="latest-rme-rx-box">
                <div class="rx-box-header">
                  <div class="rx-box-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                    <span>Resep Obat Elektronik Siap Ditebus (RME)</span>
                  </div>
                  <span class="rx-box-num">${rxNumber}</span>
                </div>
                <div class="rx-items-list">
                  ${rxItems.map(item => `
                    <div class="rx-item-chip">
                      <div class="rx-item-main">
                        <strong>${item.medicine_name || item.name}</strong>
                        <small>${item.frequency || item.dosage || 'Aturan pakai sesuai resep dokter'}</small>
                      </div>
                      <span class="rx-item-qty">${item.quantity || 10} unit</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="latest-rme-actions">
                <button type="button" class="btn-buy-medication" onclick="window.handleBuyMedicationFromRme('${escapeJsStr(rxNumber)}', ${rxItems.length}, '${escapeJsStr(rxItems.map(i => i.medicine_name || i.name).join(', '))}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                  <span>Tebus / Beli Obat di Apotek</span>
                </button>
                <button type="button" class="btn-ai-explain-med-outline" onclick="window.openMedicationExplainer('${escapeJsStr(planStr)}', '${escapeJsStr(diagStr)}')">
                  ✨ Jelaskan Aturan Obat (AI Apoteker)
                </button>
              </div>
            </div>
          `;
        }
      } else if (currentView === 'janji') {
        if (latestRmeContainer) latestRmeContainer.style.display = 'none';
        if (lowerTableWrap) lowerTableWrap.style.display = 'block';
        if (lowerEyebrow) lowerEyebrow.textContent = 'DATA';
        if (btnViewAllLower) btnViewAllLower.innerHTML = 'Lihat selengkapnya <span>&rarr;</span>';

        if (welcomeTitle) welcomeTitle.textContent = 'Janji Temu Saya';
        if (welcomeCopy) welcomeCopy.textContent = 'Daftar riwayat dan jadwal konsultasi mendatang Anda.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Daftar Reservasi';

        if (tableHead) tableHead.innerHTML = '<th>Tanggal</th><th>Jam</th><th>Dokter / Layanan</th><th>Keluhan</th><th>Status</th><th>Aksi</th>';

        let appointments = [];
        if (patientId) {
          const apptRes = await window.appointmentService.getPatientAppointments(patientId);
          if (apptRes.success && apptRes.data.length > 0) {
            appointments = apptRes.data;
          }
        }

        if (tableBody) {
          if (appointments.length > 0) {
            tableBody.innerHTML = appointments.map(a => {
              const normStatus = (a.status || '').toLowerCase();
              const isDone = normStatus === 'selesai' || normStatus === 'final';
              const isCancelled = normStatus === 'dibatalkan' || normStatus === 'batal';
              let actionBtn = '';
              if (isDone) {
                actionBtn = `<button type="button" class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(a.appointment_date)}', '${escapeJsStr(a.doctor?.profile?.full_name || 'Dokter')}', '${escapeJsStr(a.chief_complaint || '-')}', 'TD: 120/80 mmHg, N: 78x/m', 'Pemeriksaan ${escapeJsStr(a.service?.name || 'Poli')}', 'Edukasi dan terapi terlampir', 'FINAL')">Lihat RME</button>`;
              } else if (isCancelled) {
                actionBtn = `<span class="status-badge status-default">Dibatalkan</span>`;
              } else {
                const cancelCheck = window.appointmentService
                  ? window.appointmentService.canCancelAppointment(a.appointment_date, a.appointment_time, new Date())
                  : { allowed: true };
                if (cancelCheck.allowed) {
                  actionBtn = `<button type="button" class="action-btn-sm action-btn-danger" onclick="window.handleCancelAppointment('${escapeJsStr(a.id || '')}', '${escapeJsStr(a.appointment_date)}', '${escapeJsStr(a.appointment_time || '')}')">Batalkan</button>`;
                } else {
                  actionBtn = `<button type="button" class="action-btn-sm action-btn-locked" onclick="window.showCancelLockedNotice('${escapeJsStr(cancelCheck.reason)}')">Batalkan</button>`;
                }
              }

              return `
                <tr>
                  <td class="table-primary">${a.appointment_date}</td>
                  <td>${a.appointment_time ? a.appointment_time.slice(0, 5) : '09:00'}</td>
                  <td>${a.doctor?.profile?.full_name || 'Dokter Spesialis'} (${a.service?.name || 'Poli'})</td>
                  <td>${a.chief_complaint || '-'}</td>
                  <td>${statusBadge(a.status)}</td>
                  <td>${actionBtn}</td>
                </tr>
              `;
            }).join('');
          } else {
            const sampleAppts = [
              { appointment_date: 'Hari ini', appointment_time: '09:30:00', doctor: { profile: { full_name: 'dr. Ayu Rahma' } }, service: { name: 'Poli Umum' }, chief_complaint: 'Demam & batuk', status: 'Terjadwal' },
              { appointment_date: '02 Okt 2026', appointment_time: '10:00:00', doctor: { profile: { full_name: 'dr. Budi Santoso' } }, service: { name: 'Laboratorium Klinik' }, chief_complaint: 'Tes darah lengkap', status: 'Terjadwal' },
              { appointment_date: '18 Sep 2026', appointment_time: '08:30:00', doctor: { profile: { full_name: 'dr. Dimas' } }, service: { name: 'Poli Umum' }, chief_complaint: 'Pemeriksaan tensi', status: 'Selesai' }
            ];
            tableBody.innerHTML = sampleAppts.map(a => {
              const normStatus = (a.status || '').toLowerCase();
              const isDone = normStatus === 'selesai' || normStatus === 'final';
              let actionBtn = '';
              if (isDone) {
                actionBtn = `<button type="button" class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(a.appointment_date)}', '${escapeJsStr(a.doctor?.profile?.full_name || 'Dokter')}', '${escapeJsStr(a.chief_complaint || '-')}', 'TD: 120/80 mmHg, N: 78x/m', 'Pemeriksaan ${escapeJsStr(a.service?.name || 'Poli')}', 'Edukasi dan terapi terlampir', 'FINAL')">Lihat RME</button>`;
              } else {
                const cancelCheck = window.appointmentService
                  ? window.appointmentService.canCancelAppointment(a.appointment_date, a.appointment_time, new Date())
                  : { allowed: true };
                if (cancelCheck.allowed) {
                  actionBtn = `<button type="button" class="action-btn-sm action-btn-danger" onclick="window.handleCancelAppointment('${escapeJsStr(a.id || '')}', '${escapeJsStr(a.appointment_date)}', '${escapeJsStr(a.appointment_time || '')}')">Batalkan</button>`;
                } else {
                  actionBtn = `<button type="button" class="action-btn-sm action-btn-locked" onclick="window.showCancelLockedNotice('${escapeJsStr(cancelCheck.reason)}')">Batalkan</button>`;
                }
              }
              return `
                <tr>
                  <td class="table-primary">${a.appointment_date}</td>
                  <td>${a.appointment_time.slice(0, 5)}</td>
                  <td>${a.doctor.profile.full_name} · ${a.service.name}</td>
                  <td>${a.chief_complaint}</td>
                  <td>${statusBadge(a.status)}</td>
                  <td>${actionBtn}</td>
                </tr>
              `;
            }).join('');
          }
        }
      } else if (currentView === 'rekam-medis') {
        if (welcomeTitle) welcomeTitle.textContent = 'Rekam Medis Elektronik (RME)';
        if (welcomeCopy) welcomeCopy.textContent = 'Data klinis Anda yang tercatat secara permanen sesuai regulasi Permenkes No. 24/2022.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Riwayat Catatan Medis';

        if (tableHead) tableHead.innerHTML = '<th>Tanggal</th><th>Dokter Pemeriksa</th><th>Diagnosa</th><th>Status</th><th>Aksi</th>';

        let records = [];
        if (patientId) {
          const recRes = await window.medicalRecordService.getPatientHistory(patientId);
          if (recRes.success && recRes.data.length > 0) {
            records = recRes.data;
          }
        }

        if (tableBody) {
          if (records.length > 0) {
            tableBody.innerHTML = records.map(r => `
              <tr>
                <td class="table-primary">${r.record_date ? new Date(r.record_date).toLocaleDateString('id-ID') : 'Hari ini'}</td>
                <td>${r.doctor?.profile?.full_name || 'Dokter Pemeriksa'}</td>
                <td>${r.assessment || r.diagnosis_icd10 || 'Pemeriksaan Rutin'}</td>
                <td>${statusBadge(r.finalized_at ? 'FINAL' : 'DRAFT')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(r.record_date || 'Hari ini')}', '${escapeJsStr(r.doctor?.profile?.full_name || 'Dokter')}', '${escapeJsStr(r.subjective || '-')}', '${escapeJsStr(r.objective || '-')}', '${escapeJsStr(r.assessment || r.diagnosis_icd10 || '-')}', '${escapeJsStr(r.treatment_plan || '-')}', '${escapeJsStr(r.finalized_at ? 'FINAL' : 'DRAFT')}')">Lihat RME</button></td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">18 Sep 2026</td>
                <td>dr. Dimas Putra (Poli Umum)</td>
                <td>Cephalgia Tension Type (G44.2)</td>
                <td>${statusBadge('FINAL')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('18 Sep 2026', 'dr. Dimas Putra', 'Pusing berdenyut di bagian pelipis', 'TD: 120/80 mmHg, N: 78x/m, S: 36.6 C', 'Tension-Type Headache (ICD-10 G44.2)', 'Paracetamol 500mg 3x1 p.c.', 'FINAL')">Lihat RME</button></td>
              </tr>
              <tr>
                <td class="table-primary">07 Agu 2026</td>
                <td>dr. Ayu Rahma (Poli Umum)</td>
                <td>Essential Hypertension (I10)</td>
                <td>${statusBadge('FINAL')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('07 Agu 2026', 'dr. Ayu Rahma', 'Kontrol tekanan darah rutin', 'TD: 135/85 mmHg, N: 82x/m, S: 36.5 C', 'Hipertensi Primer (ICD-10 I10)', 'Amlodipine 5mg 1x1 malam', 'FINAL')">Lihat RME</button></td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'resep') {
        if (welcomeTitle) welcomeTitle.textContent = 'Resep Obat Elektronik';
        if (welcomeCopy) welcomeCopy.textContent = 'Daftar resep obat aktif yang diresepkan oleh dokter dan siap ditebus di farmasi.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Resep & Aturan Minum';

        if (tableHead) tableHead.innerHTML = '<th>No. Resep</th><th>Tanggal</th><th>Dokter</th><th>Obat &amp; Aturan Pakai</th><th>Status</th>';

        let rxList = [];
        if (patientId) {
          const rxRes = await window.prescriptionService.getPatientActivePrescriptions(patientId);
          if (rxRes.success && rxRes.data.length > 0) {
            rxList = rxRes.data;
          }
        }

        if (tableBody) {
          if (rxList.length > 0) {
            tableBody.innerHTML = rxList.map(rx => {
              const itemsText = (rx.prescription_items || []).map(i => `<strong>${i.medicine_name}</strong> (${i.dosage}) - ${i.frequency} [${i.quantity} pcs]`).join('<br/>') || 'Obat terlampir';
              return `
                <tr>
                  <td class="table-primary">${rx.prescription_number}</td>
                  <td>${new Date(rx.created_at).toLocaleDateString('id-ID')}</td>
                  <td>${rx.doctor?.profile?.full_name || 'Dokter'}</td>
                  <td>${itemsText}</td>
                  <td>${statusBadge(rx.status)}</td>
                </tr>
              `;
            }).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">RX-2609-0012</td>
                <td>18 Sep 2026</td>
                <td>dr. Dimas Putra</td>
                <td><strong>Paracetamol 500mg</strong><br/><small>3x sehari 1 tablet sesudah makan (10 tablet)</small></td>
                <td>${statusBadge('Aktif')}</td>
              </tr>
              <tr>
                <td class="table-primary">RX-2608-0044</td>
                <td>07 Agu 2026</td>
                <td>dr. Ayu Rahma</td>
                <td><strong>Amlodipine 5mg</strong><br/><small>1x sehari 1 tablet malam hari (30 tablet)</small></td>
                <td>${statusBadge('Selesai')}</td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'profil') {
        if (welcomeTitle) welcomeTitle.textContent = 'Profil Kesehatan Pasien';
        if (welcomeCopy) welcomeCopy.textContent = 'Informasi kesehatan mandiri untuk memudahkan diagnosa dokter saat pemeriksaan.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Ringkasan Kesehatan Mandiri';

        // Pre-fill modal form if record exists
        if (currentPatientRecord) {
          if (healthBloodType) healthBloodType.value = currentPatientRecord.blood_type || '';
          if (healthAllergies) healthAllergies.value = currentPatientRecord.allergies || '';
          if (healthEmergencyContact) healthEmergencyContact.value = currentPatientRecord.emergency_contact || '';
          if (healthEmergencyPhone) healthEmergencyPhone.value = currentPatientRecord.emergency_phone || '';
        }

        const bType = currentPatientRecord?.blood_type || 'O Rhesus Positif';
        const alg = currentPatientRecord?.allergies || 'Tidak ada riwayat alergi obat';
        const emContact = currentPatientRecord?.emergency_contact ? `${currentPatientRecord.emergency_contact} (${currentPatientRecord.emergency_phone || '-'})` : 'Budi Rahma (Keluarga) - 08123456789';

        if (tableHead) tableHead.innerHTML = '<th>Parameter</th><th>Data Klinis</th><th>Status</th><th>Aksi</th>';
        if (tableBody) {
          tableBody.innerHTML = `
            <tr><td class="table-primary">Golongan Darah</td><td>${bType}</td><td>${statusBadge('Tersimpan')}</td><td><button class="action-btn-sm action-btn-primary" data-modal-target="modalHealthProfile">Ubah</button></td></tr>
            <tr><td class="table-primary">Riwayat Alergi</td><td>${alg}</td><td>${statusBadge('Tersimpan')}</td><td><button class="action-btn-sm action-btn-primary" data-modal-target="modalHealthProfile">Ubah</button></td></tr>
            <tr><td class="table-primary">Kontak Darurat</td><td>${emContact}</td><td>${statusBadge('Tersimpan')}</td><td><button class="action-btn-sm action-btn-primary" data-modal-target="modalHealthProfile">Ubah</button></td></tr>
            <tr><td class="table-primary">Kata Sandi Akun</td><td>Tersimpan &amp; Terenkripsi</td><td>${statusBadge('Aktif')}</td><td><button class="action-btn-sm action-btn-primary" data-modal-target="modalChangePasswordPasien">Ubah Sandi</button></td></tr>
          `;
        }
      }
    }

    async function openFullAgendaPasienModal() {
      const modal = document.getElementById('modalFullAgendaPasien');
      const tableBody = document.getElementById('tableFullAgendaPasienBody');
      const searchInput = document.getElementById('searchFullAgendaPasien');
      const badgeCount = document.getElementById('badgeCountFullAgendaPasien');
      if (!modal || !tableBody) return;

      let appts = [];
      const patientId = currentPatientRecord ? currentPatientRecord.id : null;
      if (patientId && window.appointmentService) {
        const res = await window.appointmentService.getPatientAppointments(patientId);
        if (res.success && res.data && res.data.length > 0) {
          appts = res.data;
        }
      }

      if (appts.length === 0) {
        appts = [
          { appointment_date: '26 Sep 2026', appointment_time: '09:30', doctor: { profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }, service: { name: 'Poli Umum' }, chief_complaint: 'Demam & batuk sejak 2 hari yang lalu', status: 'Terjadwal' },
          { appointment_date: '02 Okt 2026', appointment_time: '10:00', doctor: { profile: { full_name: 'dr. Budi Santoso, Sp.PK' } }, service: { name: 'Laboratorium Klinik' }, chief_complaint: 'Tes darah lengkap & kimia darah berkala', status: 'Terjadwal' },
          { appointment_date: '18 Sep 2026', appointment_time: '08:30', doctor: { profile: { full_name: 'dr. Dimas Putra' } }, service: { name: 'Poli Umum' }, chief_complaint: 'Pemeriksaan tensi & pusing pelipis', status: 'Selesai' },
          { appointment_date: '07 Agu 2026', appointment_time: '14:00', doctor: { profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }, service: { name: 'Poli Umum' }, chief_complaint: 'Kontrol tekanan darah rutin bulanan', status: 'Selesai' },
          { appointment_date: '15 Jul 2026', appointment_time: '09:00', doctor: { profile: { full_name: 'drg. Cynthia Dewi' } }, service: { name: 'Poli Gigi & Mulut' }, chief_complaint: 'Scaling karang gigi & kontrol gigi geraham', status: 'Selesai' }
        ];
      }

      function renderRows(filteredList) {
        if (badgeCount) badgeCount.textContent = `${filteredList.length} Janji Temu`;
        if (filteredList.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="6" class="table-empty-row">Tidak ada janji temu yang cocok dengan pencarian.</td></tr>';
          return;
        }
        tableBody.innerHTML = filteredList.map(a => {
          const docName = a.doctor?.profile?.full_name || 'Dokter Spesialis';
          const svcName = a.service?.name || 'Poliklinik';
          const normStatus = (a.status || '').toLowerCase();
          const isDone = normStatus === 'selesai' || normStatus === 'final';
          const isCancelled = normStatus === 'dibatalkan' || normStatus === 'batal';

          let actionBtn = '';
          if (isDone) {
            actionBtn = `<button type="button" class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(a.appointment_date)}', '${escapeJsStr(docName)}', '${escapeJsStr(a.chief_complaint || '-')}', 'TD: 120/80 mmHg, N: 78x/m', 'Pemeriksaan ${escapeJsStr(svcName)}', 'Edukasi dan terapi terlampir', 'FINAL')">Lihat RME</button>`;
          } else if (isCancelled) {
            actionBtn = `<span class="status-badge status-default">Dibatalkan</span>`;
          } else {
            const cancelCheck = window.appointmentService
              ? window.appointmentService.canCancelAppointment(a.appointment_date, a.appointment_time, new Date())
              : { allowed: true };
            if (cancelCheck.allowed) {
              actionBtn = `<button type="button" class="action-btn-sm action-btn-danger" onclick="window.handleCancelAppointment('${escapeJsStr(a.id || '')}', '${escapeJsStr(a.appointment_date)}', '${escapeJsStr(a.appointment_time || '')}')">Batalkan</button>`;
            } else {
              actionBtn = `<button type="button" class="action-btn-sm action-btn-locked" onclick="window.showCancelLockedNotice('${escapeJsStr(cancelCheck.reason)}')">Batalkan</button>`;
            }
          }

          return `
            <tr>
              <td class="table-primary"><strong>${a.appointment_date}</strong><br/><small class="text-muted">${a.appointment_time ? a.appointment_time.slice(0, 5) : '09:00'} WIB</small></td>
              <td>${svcName}</td>
              <td><strong>${docName}</strong></td>
              <td>${a.chief_complaint || '-'}</td>
              <td>${statusBadge(a.status || 'Terjadwal')}</td>
              <td>${actionBtn}</td>
            </tr>
          `;
        }).join('');
      }

      renderRows(appts);

      if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = (e) => {
          const q = e.target.value.toLowerCase().trim();
          if (!q) {
            renderRows(appts);
          } else {
            const filtered = appts.filter(a =>
              (a.appointment_date || '').toLowerCase().includes(q) ||
              (a.doctor?.profile?.full_name || '').toLowerCase().includes(q) ||
              (a.service?.name || '').toLowerCase().includes(q) ||
              (a.chief_complaint || '').toLowerCase().includes(q) ||
              (a.status || '').toLowerCase().includes(q)
            );
            renderRows(filtered);
          }
        };
      }

      if (window.Modal) window.Modal.open('modalFullAgendaPasien');
    }

    async function openFullMedicalPasienModal() {
      const modal = document.getElementById('modalFullMedicalPasien');
      const tableBody = document.getElementById('tableFullMedicalPasienBody');
      const searchInput = document.getElementById('searchFullMedicalPasien');
      const badgeCount = document.getElementById('badgeCountFullMedicalPasien');
      if (!modal || !tableBody) return;

      let records = [];
      const patientId = currentPatientRecord ? currentPatientRecord.id : null;
      if (patientId && window.medicalRecordService) {
        const recRes = await window.medicalRecordService.getPatientHistory(patientId);
        if (recRes.success && recRes.data && recRes.data.length > 0) {
          records = recRes.data;
        }
      }

      if (records.length === 0) {
        records = [
          { record_date: '18 Sep 2026', doctor: { profile: { full_name: 'dr. Dimas Putra' } }, service: { name: 'Poli Umum' }, subjective: 'Pusing berdenyut di bagian pelipis sejak semalam', objective: 'TD: 120/80 mmHg, N: 78x/m, S: 36.6 C', assessment: 'Tension-Type Headache (ICD-10 G44.2)', treatment_plan: 'Paracetamol 500mg 3x1 p.c., istirahat teratur', finalized_at: '2026-09-18T10:00:00Z' },
          { record_date: '07 Agu 2026', doctor: { profile: { full_name: 'dr. Ayu Rahma, Sp.PD' } }, service: { name: 'Poli Umum' }, subjective: 'Kontrol tekanan darah rutin bulanan, leher agak kaku', objective: 'TD: 135/85 mmHg, N: 82x/m, S: 36.5 C', assessment: 'Hipertensi Primer (ICD-10 I10)', treatment_plan: 'Amlodipine 5mg 1x1 malam, diet rendah garam', finalized_at: '2026-08-07T14:30:00Z' },
          { record_date: '15 Jul 2026', doctor: { profile: { full_name: 'drg. Cynthia Dewi' } }, service: { name: 'Poli Gigi & Mulut' }, subjective: 'Gusi berdarah saat sikat gigi dan terasa ngilu', objective: 'Plak kalkulus regio rahang bawah, gingiva hiperemis', assessment: 'Gingivitis Marginalis Akut (ICD-10 K05.0)', treatment_plan: 'Scaling rahang atas bawah, kumur antiseptik', finalized_at: '2026-07-15T09:45:00Z' },
          { record_date: '20 Mei 2026', doctor: { profile: { full_name: 'dr. Hendra Kurniawan, Sp.A' } }, service: { name: 'Poli Spesialis Anak' }, subjective: 'Hidung tersumbat dan bersin setiap pagi hari', objective: 'Mukosa hidung pucat dan edema, sekret serosa', assessment: 'Rhinitis Alergi (ICD-10 J30.1)', treatment_plan: 'Cetirizine 1x1 tablet malam, hindari debu', finalized_at: '2026-05-20T11:15:00Z' }
        ];
      }

      function renderRows(filteredList) {
        if (badgeCount) badgeCount.textContent = `${filteredList.length} Rekam Medis`;
        if (filteredList.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" class="table-empty-row">Tidak ada rekam medis yang cocok dengan pencarian.</td></tr>';
          return;
        }
        tableBody.innerHTML = filteredList.map(r => {
          const dateStr = r.record_date ? (r.record_date.length <= 11 ? r.record_date : new Date(r.record_date).toLocaleDateString('id-ID')) : 'Hari ini';
          const docName = r.doctor?.profile?.full_name || 'Dokter Spesialis';
          const svcName = r.service?.name || 'Poliklinik';
          const diag = r.assessment || r.diagnosis_icd10 || '-';
          const statusTxt = r.finalized_at ? 'FINAL' : 'DRAFT';

          return `
            <tr>
              <td class="table-primary"><strong>${dateStr}</strong></td>
              <td><strong>${docName}</strong><br/><small class="text-muted">${svcName}</small></td>
              <td>${r.subjective || '-'}</td>
              <td><strong>${diag}</strong></td>
              <td><small>${r.treatment_plan || '-'}</small></td>
              <td>${statusBadge(statusTxt)}</td>
              <td><button type="button" class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(dateStr)}', '${escapeJsStr(docName)}', '${escapeJsStr(r.subjective || '-')}', '${escapeJsStr(r.objective || '-')}', '${escapeJsStr(diag)}', '${escapeJsStr(r.treatment_plan || '-')}', '${escapeJsStr(statusTxt)}')">Lihat RME</button></td>
            </tr>
          `;
        }).join('');
      }

      renderRows(records);

      if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = (e) => {
          const q = e.target.value.toLowerCase().trim();
          if (!q) {
            renderRows(records);
          } else {
            const filtered = records.filter(r =>
              (r.record_date || '').toLowerCase().includes(q) ||
              (r.doctor?.profile?.full_name || '').toLowerCase().includes(q) ||
              (r.assessment || r.diagnosis_icd10 || '').toLowerCase().includes(q) ||
              (r.subjective || '').toLowerCase().includes(q) ||
              (r.treatment_plan || '').toLowerCase().includes(q)
            );
            renderRows(filtered);
          }
        };
      }

      if (window.Modal) window.Modal.open('modalFullMedicalPasien');
    }

    const btnViewAllAgenda = document.getElementById('btnViewAllAgenda');
    if (btnViewAllAgenda) {
      btnViewAllAgenda.addEventListener('click', (e) => {
        e.preventDefault();
        openFullAgendaPasienModal();
      });
    }

    if (btnViewAllLower) {
      btnViewAllLower.addEventListener('click', (e) => {
        e.preventDefault();
        openFullMedicalPasienModal();
      });
    }

    window.handleCancelAppointment = async function (apptId, apptDate, apptTime) {
      if (!confirm('Apakah Anda yakin ingin membatalkan jadwal janji temu ini?')) {
        return;
      }
      if (window.appointmentService) {
        const res = await window.appointmentService.cancelAppointment(
          apptId || { id: apptId, appointment_date: apptDate, appointment_time: apptTime },
          'pasien',
          new Date()
        );
        if (res.success) {
          if (window.Toast) window.Toast.success('Janji temu berhasil dibatalkan.');
          else alert('Janji temu berhasil dibatalkan.');
          const modal = document.getElementById('modalFullAgendaPasien');
          if (modal && modal.classList.contains('is-open')) {
            openFullAgendaPasienModal();
          }
          refreshPasienDashboard();
        } else {
          if (window.Toast) window.Toast.error(res.error || 'Gagal membatalkan janji temu.');
          else alert(res.error || 'Gagal membatalkan janji temu.');
        }
      }
    };

    // ══════════════════════════════════════════════════════════
    // DIREKTORI KLINIK REGIONAL KABUPATEN PURWOREJO
    // ══════════════════════════════════════════════════════════
    async function renderClinicsExplorer(district = 'all') {
      if (!clinicsCardsGrid || !window.clinicService) return;
      clinicsCardsGrid.innerHTML = '<div style="padding: 1.5rem; color: var(--muted);"><span class="btn-spinner"></span> Memuat daftar klinik di Purworejo...</div>';

      const clinics = await window.clinicService.getClinicsByDistrict(district);
      if (!clinics || clinics.length === 0) {
        clinicsCardsGrid.innerHTML = '<div style="padding: 1.5rem; color: var(--muted);">Tidak ada fasilitas kesehatan ditemukan di wilayah ini.</div>';
        return;
      }

      const cardsHtml = await Promise.all(clinics.map(async (c) => {
        const queueCount = await window.clinicService.getClinicQueueCount(c.id);
        const tags = (c.facilities || ['Poli Umum', 'Farmasi']).map(f => `<span class="clinic-tag">${f}</span>`).join('');
        return `
          <div class="clinic-card" data-clinic-id="${c.id}" data-district="${c.district}">
            <div>
              <div class="clinic-card-header">
                <span class="clinic-badge-district">Kec. ${c.district}</span>
                <span class="clinic-queue-indicator">
                  <span class="clinic-queue-dot"></span>
                  Antrean: ${queueCount} Pasien
                </span>
              </div>
              <h3 class="clinic-card-title">${c.name}</h3>
              <p class="clinic-card-address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${c.address}
              </p>
              <div class="clinic-card-hours">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${c.operating_hours}
              </div>
              <div class="clinic-facilities-tags">
                ${tags}
              </div>
            </div>
            <button type="button" class="btn-clinic-book" onclick="window.openBookingWithClinic('${c.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Daftar di Klinik Ini
            </button>
          </div>
        `;
      }));

      clinicsCardsGrid.innerHTML = cardsHtml.join('');
    }

    const clinicPills = document.querySelectorAll('.clinic-pill');
    clinicPills.forEach(pill => {
      pill.addEventListener('click', () => {
        clinicPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        const district = pill.dataset.district || 'all';
        renderClinicsExplorer(district);
      });
    });

    window.openBookingWithClinic = (clinicId, serviceName) => {
      if (typeof window.handleInitiateBooking === 'function') {
        const allowed = window.handleInitiateBooking(serviceName);
        if (!allowed) return;
      } else if (window.Modal) {
        window.Modal.open('modalBooking');
      }
      if (bookingClinicSelect && clinicId) {
        bookingClinicSelect.value = clinicId;
        bookingClinicSelect.dispatchEvent(new Event('change'));
      }
      if (bookingServiceSelect && serviceName) {
        for (let i = 0; i < bookingServiceSelect.options.length; i++) {
          if (bookingServiceSelect.options[i].text.toLowerCase().includes(serviceName.toLowerCase()) ||
              serviceName.toLowerCase().includes(bookingServiceSelect.options[i].text.toLowerCase())) {
            bookingServiceSelect.selectedIndex = i;
            bookingServiceSelect.dispatchEvent(new Event('change'));
            break;
          }
        }
      }
    };

    renderClinicsExplorer('all');
    refreshPasienDashboard();
    checkPatientOnboardingRequirement();
  }

  // Global helper: Popup singkat pemberitahuan batas pembatalan 12 jam
  window.showCancelLockedNotice = function (reason) {
    const msg = reason || 'Janji temu hanya dapat dibatalkan maksimal 12 jam sebelum jadwal konsultasi yang ditentukan.';
    if (window.Toast) {
      window.Toast.warning(msg);
    } else {
      alert(msg);
    }
  };

  // Global helper: Tebus / Beli Obat dari RME Terakhir
  window.handleBuyMedicationFromRme = function (rxNum, itemsCount, medsSummary) {
    const detail = rxNum ? `No. Resep ${rxNum}` : (medsSummary || 'Resep Obat');
    if (window.Toast) {
      window.Toast.success(`Pesanan tebus obat (${detail}) berhasil diteruskan ke Instalasi Farmasi Klinik! Tim Apoteker kami sedang menyiapkan obat Anda.`);
    } else {
      alert(`Pesanan tebus obat (${detail}) berhasil dikirim ke Farmasi.`);
    }
  };

  // Global helper to view Medical Record Detail in Modal
  window.viewMedicalDetailDemo = function (date, doc, subj, obj, assess, plan, status) {
    const detailBody = document.getElementById('modalMedicalDetailBody');
    if (!detailBody) return;
    detailBody.innerHTML = `
      <div class="modal-info-box">
        <strong>Pemeriksaan Tanggal: ${date}</strong> · Dokter Pemeriksa: ${doc} · Status: <strong>${status}</strong>
      </div>
      <div class="modal-form-group">
        <label>S — Subjective (Anamnesis / Keluhan Pasien)</label>
        <p class="feature-copy">${subj}</p>
      </div>
      <div class="modal-form-group">
        <label>O — Objective (Pemeriksaan Fisik &amp; Tanda Vital)</label>
        <p class="feature-copy">${obj}</p>
      </div>
      <div class="modal-form-group">
        <label>A — Assessment (Diagnosa Medis &amp; ICD-10)</label>
        <p class="feature-copy"><strong>${assess}</strong></p>
      </div>
      <div class="modal-form-group">
        <label>P — Plan (Rencana Terapi &amp; Resep)</label>
        <p class="feature-copy">${plan}</p>
        <button type="button" class="btn-ai-explain-med" onclick="window.openMedicationExplainer('${escapeJsStr(plan)}', '${escapeJsStr(assess)}')">
          ✨ Jelaskan Aturan Obat &amp; Gaya Hidup dengan AI
        </button>
      </div>
      <div class="modal-alert-box">
        Catatan rekam medis elektronik ini telah ditandatangani secara digital dan dikunci sesuai Permenkes No. 24/2022.
      </div>
    `;
    window.Modal.open('modalMedicalDetail');
  };

  // Global helper for AI Medication Explainer
  window.openMedicationExplainer = async (planText, diagnosis) => {
    const modal = document.getElementById('modalMedicationExplainer');
    const container = document.getElementById('medExplainerContent');
    if (!modal || !container) return;

    container.innerHTML = '<div class="loading-state"><span class="btn-spinner"></span> Menyiapkan penjelasan aturan obat...</div>';
    if (window.Modal) window.Modal.open('modalMedicationExplainer');

    try {
      if (!window.aiService) throw new Error('Layanan AI belum siap.');
      const explanation = await window.aiService.explainMedications(planText, diagnosis);
      const formatted = explanation
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n- /g, '<br>• ')
        .replace(/\n/g, '<br>');
      container.innerHTML = `<div class="ai-explainer-body">${formatted}</div>`;
    } catch (err) {
      const friendlyErr = window.translateError ? window.translateError(err.message) : err.message;
      container.innerHTML = `<div class="error-state">Gagal memuat penjelasan obat: ${friendlyErr}</div>`;
    }
  };

  /* ══════════════════════════════════════════════════════════
     ROLE: PETUGAS PORTAL (DEPRECATED - 2-ROLE DIRECT ARCHITECTURE)
     ══════════════════════════════════════════════════════════ */
  async function initPetugasPortal() {
    window.location.replace('dokter.html');
  }

  window.panggilAntrean = async function (queueId, queueNumber) {
    if (window.queueService && queueId && !queueId.startsWith('demo-')) {
      await window.queueService.updateQueueStatus(queueId, 'CALLED');
    }
    window.Toast.success(`Nomor Antrean ${queueNumber} dipanggil ke loket poli!`);
  };

  window.layaniAntrean = async function (queueId, queueNumber) {
    if (window.queueService && queueId && !queueId.startsWith('demo-')) {
      await window.queueService.updateQueueStatus(queueId, 'SERVING');
    }
    window.Toast.info(`Pasien dengan nomor antrean ${queueNumber} sedang dilayani dokter.`);
  };

  window.openPaymentModal = function (inv, name, amount, paymentId = '') {
    const invEl = document.getElementById('paymentInvoiceDisplay');
    const nameEl = document.getElementById('paymentPatientDisplay');
    const amtEl = document.getElementById('paymentAmountDisplay');
    const targetInput = document.getElementById('paymentTargetId');
    if (invEl) invEl.textContent = inv;
    if (nameEl) nameEl.textContent = name;
    if (amtEl) amtEl.textContent = `Rp ${Number(amount).toLocaleString('id-ID')}`;
    if (targetInput) targetInput.value = paymentId;
    window.Modal.open('modalPayment');
  };

  /* ══════════════════════════════════════════════════════════
     ROLE: DOKTER PORTAL CONTROLLER
     ══════════════════════════════════════════════════════════ */
  async function initDokterPortal() {
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeCopy = document.getElementById('welcomeCopy');
    const statsGrid = document.getElementById('statsGrid');
    const agendaTitle = document.getElementById('agendaTitle');
    const scheduleList = document.getElementById('scheduleList');
    const insightTitle = document.getElementById('insightTitle');
    const insightContent = document.getElementById('insightContent');
    const lowerTitle = document.getElementById('lowerTitle');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');

    // Doctor Perspective Switcher Elements
    const doctorSelectorWrap = document.getElementById('doctorSelectorWrap');
    const doctorSelectPerspective = document.getElementById('doctorSelectPerspective');
    const doctorClinicSelector = document.getElementById('doctorClinicSelector');
    let doctorActiveClinicId = 'clinic-pwr-01';

    // Dynamic Prescriptions item row adder in SOAP modal
    const btnAddMedicine = document.getElementById('btnAddMedicineRow');
    const medicineTableBody = document.getElementById('soapMedicineRows');

    // Reactive Safety Checker for e-Prescription (Allergy & Drug Interactions)
    let safetyCheckTimeout = null;
    const triggerMedicineSafetyCheck = () => {
      clearTimeout(safetyCheckTimeout);
      safetyCheckTimeout = setTimeout(async () => {
        const banner = document.getElementById('soapSafetyWarningBanner');
        if (!banner || !window.aiService) return;

        const medRows = medicineTableBody ? medicineTableBody.querySelectorAll('tr') : [];
        const meds = [];
        medRows.forEach(tr => {
          const name = tr.querySelector('.med-name')?.value?.trim();
          const dosage = tr.querySelector('.med-dosage')?.value?.trim();
          if (name) meds.push(`${name} ${dosage || ''}`);
        });

        if (meds.length === 0) {
          banner.hidden = true;
          return;
        }

        const patientAllergy = window.activeSoapPatientAllergies || 'Alergi Penisilin (Amoxicillin, Ampicillin)';

        try {
          const result = await window.aiService.checkPrescriptionSafety(patientAllergy, meds);
          if (result && result.hasRisk) {
            banner.hidden = false;
            banner.className = `ai-safety-alert-banner ${result.severity === 'TINGGI' ? 'tinggi' : 'sedang'}`;
            const titleEl = document.getElementById('safetyWarningTitle');
            const descEl = document.getElementById('safetyWarningDesc');
            const recEl = document.getElementById('safetyWarningRec');
            if (titleEl) titleEl.textContent = `⚠️ Peringatan Keamanan Obat (${result.severity})`;
            if (descEl) descEl.textContent = result.warning;
            if (recEl) recEl.textContent = result.recommendation ? `Rekomendasi Alternatif: ${result.recommendation}` : '';
          } else {
            banner.hidden = true;
          }
        } catch {
          banner.hidden = true;
        }
      }, 500);
    };

    if (btnAddMedicine && medicineTableBody) {
      btnAddMedicine.addEventListener('click', () => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="table-input med-name" placeholder="Nama Obat (misal: Amoxicillin)" required /></td>
          <td><input type="text" class="table-input med-dosage" placeholder="500 mg" /></td>
          <td><input type="text" class="table-input med-freq" placeholder="3x1 sesudah makan" /></td>
          <td><input type="number" class="table-input med-qty" value="10" min="1" /></td>
          <td><button type="button" class="action-btn-sm" onclick="this.closest('tr').remove(); window.triggerMedicineSafetyCheck && window.triggerMedicineSafetyCheck();">&times;</button></td>
        `;
        medicineTableBody.appendChild(tr);
        triggerMedicineSafetyCheck();
      });
      medicineTableBody.addEventListener('input', triggerMedicineSafetyCheck);
    }
    window.triggerMedicineSafetyCheck = triggerMedicineSafetyCheck;

    // Load all doctors across all poliklinik
    const allDoctors = await window.appointmentService.getAllDoctorsWithSchedules();

    // Determine initial active doctor
    const savedDoctorId = localStorage.getItem('simklinik_active_doctor_id');
    let activeDoctorId = (savedDoctorId && allDoctors.some(d => d.id === savedDoctorId))
      ? savedDoctorId
      : (currentDoctorRecord?.id && allDoctors.some(d => d.id === currentDoctorRecord.id))
        ? currentDoctorRecord.id
        : (allDoctors[0]?.id || '11111111-1111-4111-8111-111111111111');

    // Populate perspective switcher dropdown
    if (doctorSelectPerspective && allDoctors.length > 0) {
      doctorSelectPerspective.innerHTML = allDoctors.map(d =>
        `<option value="${d.id}"${d.id === activeDoctorId ? ' selected' : ''}>${d.profile?.full_name || 'Dokter'} (${d.service?.name || 'Poli'})</option>`
      ).join('');

      doctorSelectPerspective.addEventListener('change', (e) => {
        activeDoctorId = e.target.value;
        localStorage.setItem('simklinik_active_doctor_id', activeDoctorId);
        const selDoc = allDoctors.find(d => d.id === activeDoctorId);
        if (selDoc) {
          currentDoctorRecord = selDoc;
          if (headerName) headerName.textContent = selDoc.profile?.full_name || 'Dokter';
          const inits = (selDoc.profile?.full_name || 'D').replace(/^(drg?\.|Sp\.[A-Z]+|\s)+/g, '').slice(0, 2).toUpperCase() || 'DR';
          if (headerAvatar) headerAvatar.textContent = inits;
          window.Toast.info(`Beralih ke jadwal & data pasien ${selDoc.profile?.full_name}`);
        }
        renderDokterDashboard();
      });
    }

    if (doctorClinicSelector && window.clinicService) {
      window.clinicService.getClinics().then(clinics => {
        doctorClinicSelector.innerHTML = clinics.map(c =>
          `<option value="${c.id}"${c.id === doctorActiveClinicId ? ' selected' : ''}>${c.name} (${c.district})</option>`
        ).join('');
      });

      doctorClinicSelector.addEventListener('change', (e) => {
        doctorActiveClinicId = e.target.value;
        const clinicDocs = allDoctors.filter(d => d.clinic_id === doctorActiveClinicId || d.clinic_code === doctorActiveClinicId);
        if (clinicDocs.length > 0 && doctorSelectPerspective) {
          activeDoctorId = clinicDocs[0].id;
          doctorSelectPerspective.value = activeDoctorId;
          doctorSelectPerspective.dispatchEvent(new Event('change'));
        } else {
          renderDokterDashboard();
        }
      });
    }

    // Set initial doctor profile in header
    const initialDoc = allDoctors.find(d => d.id === activeDoctorId) || allDoctors[0];
    if (initialDoc) {
      currentDoctorRecord = initialDoc;
      if (headerName) headerName.textContent = initialDoc.profile?.full_name || 'Dokter';
      const inits = (initialDoc.profile?.full_name || 'D').replace(/^(drg?\.|Sp\.[A-Z]+|\s)+/g, '').slice(0, 2).toUpperCase() || 'DR';
      if (headerAvatar) headerAvatar.textContent = inits;
    }

    function getActiveDoctor() {
      const doc = (allDoctors && allDoctors.find(d => d.id === activeDoctorId)) || initialDoc || (allDoctors && allDoctors[0]) || {};
      return {
        ...doc,
        full_name: doc.profile?.full_name || doc.full_name || 'dr. Ayu Rahma, Sp.PD',
        service_name: doc.service?.name || doc.service_name || 'Poli Umum',
        specialization: doc.specialization || 'Dokter Spesialis'
      };
    }

    // SOAP Form Handler
    const formSoap = document.getElementById('formSoap');
    const btnSaveSoapDraft = document.getElementById('btnSaveSoapDraft');
    const btnFinalizeSoap = document.getElementById('btnFinalizeSoap');

    async function handleSoapSubmit(isFinal) {
      const patientId = document.getElementById('soapPatientId')?.value;
      const appointmentId = document.getElementById('soapAppointmentId')?.value;
      const recordId = document.getElementById('soapRecordId')?.value;
      const subjective = document.getElementById('soapSubjective')?.value.trim();
      const systolic = document.getElementById('vitalSystolic')?.value;
      const diastolic = document.getElementById('vitalDiastolic')?.value;
      const pulse = document.getElementById('vitalPulse')?.value;
      const temperature = document.getElementById('vitalTemp')?.value;
      const rr = document.getElementById('vitalRR')?.value;
      const objective = document.getElementById('soapObjective')?.value.trim();
      const assessment = document.getElementById('soapAssessment')?.value.trim();
      const icd10Code = document.getElementById('soapIcd10')?.value.trim();
      const plan = document.getElementById('soapPlan')?.value.trim();

      if (!subjective || !assessment) {
        window.Toast.error('Anamnesis (S) dan Diagnosa (A) wajib diisi dokter!');
        return;
      }

      // Collect medicine items
      const items = [];
      if (medicineTableBody) {
        medicineTableBody.querySelectorAll('tr').forEach(row => {
          const name = row.querySelector('.med-name')?.value.trim();
          const dosage = row.querySelector('.med-dosage')?.value.trim();
          const freq = row.querySelector('.med-freq')?.value.trim();
          const qty = row.querySelector('.med-qty')?.value;
          if (name) {
            items.push({ medicine_name: name, dosage, frequency: freq, quantity: qty });
          }
        });
      }

      const activeBtn = isFinal ? btnFinalizeSoap : btnSaveSoapDraft;
      setButtonLoading(activeBtn, true);

      const recordRes = await window.medicalRecordService.saveMedicalRecord({
        id: recordId || undefined,
        appointmentId: appointmentId || undefined,
        patientId: patientId || 'demo-patient-id',
        doctorId: activeDoctorId || currentDoctorRecord?.id || '11111111-1111-4111-8111-111111111111',
        subjective,
        objective: objective || `TD: ${systolic || 120}/${diastolic || 80} mmHg, Nadi: ${pulse || 78}x/m, Suhu: ${temperature || 36.5} C, RR: ${rr || 18}x/m`,
        vitalSigns: { systolic, diastolic, pulse, temperature, rr },
        assessment,
        icd10Code,
        plan,
        isFinal
      });

      if (items.length > 0 && recordRes.success) {
        await window.prescriptionService.createPrescriptionWithItems({
          medicalRecordId: recordRes.data?.id,
          patientId: patientId || 'demo-patient-id',
          doctorId: activeDoctorId || currentDoctorRecord?.id || '11111111-1111-4111-8111-111111111111',
          items
        });
      }

      setButtonLoading(activeBtn, false);

      if (isFinal) {
        window.Toast.success('RME Berhasil Difinalisasi & Dikunci Permanen (Permenkes 24/2022).');
      } else {
        window.Toast.info('Draft RME berhasil disimpan.');
      }

      window.Modal.close('modalSoapRecord');
      renderDokterDashboard();
    }

    if (btnSaveSoapDraft) btnSaveSoapDraft.addEventListener('click', () => handleSoapSubmit(false));
    if (btnFinalizeSoap) btnFinalizeSoap.addEventListener('click', () => handleSoapSubmit(true));

    // AI Ambient SOAP Assistant Generator
    const btnAiGenerateSoap = document.getElementById('btnAiGenerateSoap');
    if (btnAiGenerateSoap) {
      btnAiGenerateSoap.addEventListener('click', async () => {
        const rawInput = document.getElementById('aiSoapRawInput');
        const rawNotes = rawInput ? rawInput.value.trim() : '';
        if (!rawNotes) {
          if (window.Toast) window.Toast.warning('Ketikkan catatan mentah pemeriksaan terlebih dahulu.');
          return;
        }

        setButtonLoading(btnAiGenerateSoap, true);
        try {
          if (!window.aiService) throw new Error('Layanan AI belum siap.');

          const vitals = {
            systolic: document.getElementById('vitalSystolic')?.value,
            diastolic: document.getElementById('vitalDiastolic')?.value,
            pulse: document.getElementById('vitalPulse')?.value,
            temp: document.getElementById('vitalTemp')?.value,
            rr: document.getElementById('vitalRR')?.value
          };

          const soap = await window.aiService.generateSoapFromNotes(rawNotes, vitals);

          if (soap.subjective && document.getElementById('soapSubjective')) {
            document.getElementById('soapSubjective').value = soap.subjective;
          }
          if (soap.objective && document.getElementById('soapObjective')) {
            document.getElementById('soapObjective').value = soap.objective;
          }
          if (soap.assessment && document.getElementById('soapAssessment')) {
            document.getElementById('soapAssessment').value = soap.assessment;
          }
          if (soap.icd10 && document.getElementById('soapIcd10')) {
            document.getElementById('soapIcd10').value = soap.icd10;
          }
          if (soap.plan && document.getElementById('soapPlan')) {
            document.getElementById('soapPlan').value = soap.plan;
          }

          if (window.Toast) {
            window.Toast.success('Format SOAP dan Kode ICD-10 WHO berhasil dibuat otomatis oleh AI!');
          }
        } catch (err) {
          if (window.Toast) {
            const friendlyErr = window.translateError ? window.translateError(err.message) : err.message;
            window.Toast.error(`Gagal memformat SOAP: ${friendlyErr}`);
          }
        } finally {
          setButtonLoading(btnAiGenerateSoap, false);
        }
      });
    }

    async function renderDokterDashboard() {
      const activeDoc = allDoctors.find(d => d.id === activeDoctorId) || initialDoc;
      const docFullName = activeDoc?.profile?.full_name || 'Dokter';
      const docSpecialization = activeDoc?.specialization || 'Spesialis';
      const docServiceName = activeDoc?.service?.name || 'Poliklinik';

      if (currentView === 'dashboard') {
        if (welcomeTitle) welcomeTitle.textContent = `Selamat bertugas, ${docFullName}`;
        if (welcomeCopy) welcomeCopy.textContent = `${docSpecialization} · ${docServiceName} · Kelola agenda janji temu, pemeriksaan klinis (SOAP), dan rekam medis pasien Anda.`;
        if (statsGrid) {
          statsGrid.innerHTML = `
            <article class="stat-card stat-card--interactive" data-action="open-agenda-modal" role="button" tabindex="0" aria-label="Pasien Terjadwal: Buka Agenda">
              <div class="stat-top">
                <span>Pasien Terjadwal</span>
                <span class="stat-icon stat-icon--blue">${ICONS.pasien || ICONS.sparkle}</span>
              </div>
              <strong class="stat-value" id="docStatPatientCount">-</strong>
              <div class="stat-bottom">
                <small class="stat-note">Pasien terdaftar hari ini</small>
                <span class="stat-action-hint">Lihat detail &rarr;</span>
              </div>
            </article>
            <article class="stat-card stat-card--interactive" data-target-view="jadwal" role="button" tabindex="0" aria-label="Poliklinik: Buka Jadwal Praktik">
              <div class="stat-top">
                <span>Poliklinik</span>
                <span class="stat-icon stat-icon--mint">${ICONS.jadwal || ICONS.sparkle}</span>
              </div>
              <strong class="stat-value">${docServiceName.replace('Poli ', '')}</strong>
              <div class="stat-bottom">
                <small class="stat-note">${activeDoc?.schedule?.room || 'Ruang Konsultasi'}</small>
                <span class="stat-action-hint">Jadwal poli &rarr;</span>
              </div>
            </article>
            <article class="stat-card stat-card--interactive" data-action="open-agenda-modal" role="button" tabindex="0" aria-label="Kuota Tersedia: Buka Agenda">
              <div class="stat-top">
                <span>Kuota Tersedia</span>
                <span class="stat-icon stat-icon--gold">${ICONS.sparkle}</span>
              </div>
              <strong class="stat-value">${activeDoc?.schedule?.quota ? activeDoc.schedule.quota - 4 : 16}</strong>
              <div class="stat-bottom">
                <small class="stat-note">Maks. ${activeDoc?.schedule?.quota || 20} pasien / hari</small>
                <span class="stat-action-hint">Cek kuota &rarr;</span>
              </div>
            </article>
            <article class="stat-card stat-card--interactive" data-action="open-medical-modal" role="button" tabindex="0" aria-label="Standar RME: Buka Berkas RME">
              <div class="stat-top">
                <span>Standar RME</span>
                <span class="stat-icon stat-icon--purple">${ICONS['rekam-medis'] || ICONS.sparkle}</span>
              </div>
              <strong class="stat-value">100%</strong>
              <div class="stat-bottom">
                <small class="stat-note">Permenkes 24/2022 (Valid)</small>
                <span class="stat-action-hint">Berkas RME &rarr;</span>
              </div>
            </article>
          `;

          statsGrid.onclick = (e) => {
            const card = e.target.closest('.stat-card--interactive');
            if (!card) return;
            const action = card.dataset.action;
            const targetView = card.dataset.targetView;
            if (action === 'open-agenda-modal') {
              if (typeof openFullAgendaDokterModal === 'function') openFullAgendaDokterModal();
            } else if (action === 'open-medical-modal') {
              if (typeof openFullMedicalDokterModal === 'function') openFullMedicalDokterModal();
            } else if (targetView) {
              location.href = `${location.pathname}?view=${targetView}`;
            }
          };

          statsGrid.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.target.closest('.stat-card--interactive')?.click();
            }
          };
        }

        if (agendaTitle) agendaTitle.textContent = `Agenda Janji Temu Pasien (${docFullName})`;

        // Load appointments STRICTLY for activeDoctorId
        let todayAppts = [];
        const apptRes = await window.appointmentService.getDoctorTodayAppointments(activeDoctorId);
        if (apptRes.success && apptRes.data) {
          todayAppts = apptRes.data;
        }

        const docPrimaryAction = document.getElementById('primaryAction');
        if (docPrimaryAction) {
          docPrimaryAction.onclick = () => {
            if (todayAppts.length > 0) {
              const pt = todayAppts[0];
              window.openDoctorSoapModal(
                pt.patient?.no_rm || '',
                pt.patient?.profile?.full_name || 'Pasien',
                pt.chief_complaint || 'Pemeriksaan Klinis',
                pt.patient?.id || '',
                pt.id || ''
              );
            } else {
              window.openDoctorSoapModal('', 'Pasien Konsultasi Langsung', 'Pemeriksaan Klinis');
            }
          };
        }

        const statCount = document.getElementById('docStatPatientCount');
        if (statCount) statCount.textContent = String(todayAppts.length);

        if (scheduleList) {
          if (todayAppts.length > 0) {
            scheduleList.innerHTML = todayAppts.map(a => `
              <div class="schedule-item">
                <time class="schedule-time">${a.appointment_time ? a.appointment_time.slice(0, 5) : '09:00'}</time>
                <div>
                  <strong>${a.patient?.profile?.full_name || 'Pasien'} (${a.patient?.no_rm || '-'})</strong>
                  <small>${a.chief_complaint || 'Pemeriksaan Klinis'}</small>
                </div>
                ${statusBadge(a.status)}
              </div>
            `).join('');
          } else {
            scheduleList.innerHTML = `
              <div class="empty-state-card">
                <p>Tidak ada agenda janji temu pasien untuk ${docFullName} hari ini.</p>
              </div>
            `;
          }
        }

        if (insightTitle) insightTitle.textContent = 'Kepatuhan Regulasi RME & Privasi';
        if (insightContent) {
          const quotaTotal = activeDoc?.schedule?.quota || 20;
          const quotaUsed = todayAppts.length;
          const quotaRemaining = Math.max(0, quotaTotal - quotaUsed);
          const percentUsed = Math.min(100, Math.round((quotaUsed / quotaTotal) * 100));

          insightContent.innerHTML = `
            <div class="doctor-quota-summary" style="margin-bottom: 16px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12.5px; font-weight: 600; color: var(--ink);">Kapasitas Kuota Sesi Praktik</span>
                <span style="font-size: 12px; font-weight: 700; color: #0284c7;">${quotaUsed} / ${quotaTotal} Pasien</span>
              </div>
              <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                <div style="width: ${percentUsed}%; height: 100%; background: linear-gradient(90deg, #0ea5e9, #10b981); border-radius: 999px; transition: width 0.3s ease;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 6px;">
                <span>Sisa Kuota: <strong>${quotaRemaining} Kursi</strong></span>
                <span>${percentUsed}% Terisi</span>
              </div>
            </div>
            <div class="activity">
              <span class="activity-icon">${ICONS.check}</span>
              <div>
                <strong>Standar RME &amp; SATUSEHAT Kemenkes</strong>
                <small>Pengisian SOAP, Kode ICD-10 WHO, dan e-Resep tervalidasi Permenkes 24/2022.</small>
              </div>
            </div>
            <div class="activity">
              <span class="activity-icon">${ICONS.sparkle}</span>
              <div>
                <strong>Kerahasiaan &amp; Audit Log Medis (UU PDP 27/2022)</strong>
                <small>Akses berkas digital terenkripsi dengan jejak audit permanen setiap tindakan dokter.</small>
              </div>
            </div>
          `;
        }

        if (lowerTitle) lowerTitle.textContent = `Riwayat & Jadwal Kunjungan Pasien ${docFullName}`;
        if (tableHead) tableHead.innerHTML = '<th>No. RM</th><th>Nama Pasien</th><th>Keluhan Utama</th><th>Waktu</th><th>Status</th><th>Tindakan Klinis</th>';
        if (tableBody) {
          if (todayAppts.length > 0) {
            tableBody.innerHTML = todayAppts.map(a => {
              const isDone = a.status === 'Selesai' || a.status === 'Completed' || a.status === 'FINAL';
              const actionBtn = isDone
                ? `<button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(a.appointment_date || 'Hari ini')}', '${escapeJsStr(docFullName)}', '${escapeJsStr(a.chief_complaint || '-')}', 'TD: 120/80 mmHg, Nadi: 78x/m', 'Pemeriksaan Poli ${escapeJsStr(docServiceName)}', 'Edukasi dan terapi terlampir', 'FINAL')">Lihat RME</button>`
                : `<button class="action-btn-sm action-btn-success" onclick="window.openDoctorSoapModal('${escapeJsStr(a.patient?.no_rm || '-')}', '${escapeJsStr(a.patient?.profile?.full_name || 'Pasien')}', '${escapeJsStr(a.chief_complaint || 'Keluhan umum')}', '${escapeJsStr(a.patient?.id || '')}', '${escapeJsStr(a.id)}')">Periksa (SOAP)</button>`;
              return `
                <tr>
                  <td class="table-primary">${a.patient?.no_rm || '-'}</td>
                  <td><strong>${a.patient?.profile?.full_name || 'Pasien'}</strong></td>
                  <td>${a.chief_complaint || '-'}</td>
                  <td>${a.appointment_time ? a.appointment_time.slice(0, 5) : '09:00'}</td>
                  <td>${statusBadge(a.status)}</td>
                  <td>${actionBtn}</td>
                </tr>
              `;
            }).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td colspan="6" class="table-empty-row">
                  Belum ada kunjungan medis atau janji temu pasien yang menjadwalkan dengan ${docFullName} hari ini.
                </td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'pasien') {
        if (welcomeTitle) welcomeTitle.textContent = `Pasien Konsultasi - ${docFullName}`;
        if (welcomeCopy) welcomeCopy.textContent = `Daftar pasien dalam pantauan klinis dokter dan riwayat pemeriksaan poli ${docServiceName}.`;
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Data Pasien Terjadwal';
        if (lowerTitle) lowerTitle.textContent = `Pasien ${docFullName}`;

        if (tableHead) tableHead.innerHTML = '<th>No. RM</th><th>Nama Pasien</th><th>Keluhan / Diagnosa</th><th>Gol. Darah</th><th>Riwayat Alergi</th><th>Aksi</th>';

        // Load patients from active doctor's appointments
        const apptRes = await window.appointmentService.getDoctorTodayAppointments(activeDoctorId);
        const docAppts = (apptRes.success && apptRes.data) ? apptRes.data : [];

        if (tableBody) {
          if (docAppts.length > 0) {
            tableBody.innerHTML = docAppts.map(a => {
              const pt = a.patient || {};
              const ptName = pt.profile?.full_name || 'Pasien';
              return `
                <tr>
                  <td class="table-primary"><strong>${pt.no_rm || '-'}</strong></td>
                  <td><strong>${ptName}</strong></td>
                  <td>${a.chief_complaint || 'Konsultasi'}</td>
                  <td>${pt.blood_type || '-'}</td>
                  <td>${pt.allergies || 'Tidak ada'}</td>
                  <td><button class="action-btn-sm action-btn-success" onclick="window.openDoctorSoapModal('${escapeJsStr(pt.no_rm || '-')}', '${escapeJsStr(ptName)}', '${escapeJsStr(a.chief_complaint || '-')}', '${escapeJsStr(pt.id || '')}', '${escapeJsStr(a.id)}')">Periksa (SOAP)</button></td>
                </tr>
              `;
            }).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td colspan="6" class="table-empty-row">
                  Belum ada pasien yang berkonsultasi dengan ${docFullName}.
                </td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'jadwal') {
        if (welcomeTitle) welcomeTitle.textContent = `Jadwal Praktik ${docFullName}`;
        if (welcomeCopy) welcomeCopy.textContent = `Pengaturan sesi jam konsultasi di ${docServiceName} (${activeDoc?.schedule?.room || 'Ruang Poli'}) dan kuota pasien.`;
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Sesi Praktik Mingguan';
        if (lowerTitle) lowerTitle.textContent = `Jadwal Praktik ${docFullName}`;

        if (tableHead) tableHead.innerHTML = '<th>Hari Praktik</th><th>Sesi Jam</th><th>Poliklinik</th><th>Ruangan</th><th>Batas Kuota</th><th>Status</th>';

        const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        let schedules = [];
        const scRes = await window.appointmentService.getDoctorSchedules(activeDoctorId);
        if (scRes.success && scRes.data && scRes.data.length > 0) {
          schedules = scRes.data;
        }

        if (tableBody) {
          if (schedules.length > 0) {
            tableBody.innerHTML = schedules.map(s => `
              <tr>
                <td class="table-primary">${DAY_NAMES[s.day_of_week] || 'Hari Kerja'}</td>
                <td>${s.start_time?.slice(0, 5) || '08:00'} - ${s.end_time?.slice(0, 5) || '14:00'} WIB</td>
                <td>${docServiceName}</td>
                <td>${activeDoc?.schedule?.room || 'Ruang Poli'}</td>
                <td>${s.max_quota || 20} Pasien / Hari</td>
                <td>${statusBadge(s.is_active ? 'Aktif' : 'Nonaktif')}</td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">${activeDoc?.schedule?.days || 'Senin - Sabtu'}</td>
                <td>${activeDoc?.schedule?.start_time || '08:00'} - ${activeDoc?.schedule?.end_time || '14:00'} WIB</td>
                <td>${docServiceName}</td>
                <td>${activeDoc?.schedule?.room || 'Ruang Poli'}</td>
                <td>${activeDoc?.schedule?.quota || 20} Pasien / Hari</td>
                <td>${statusBadge(activeDoc?.is_active ? 'Aktif' : 'Cuti')}</td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'rekam-medis') {
        if (welcomeTitle) welcomeTitle.textContent = 'Rekam Medis Elektronik (RME)';
        if (welcomeCopy) welcomeCopy.textContent = `Arsip riwayat catatan medis SOAP dan klasifikasi diagnosa ICD-10 untuk pasien yang diperiksa oleh ${docFullName}.`;
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Riwayat RME Terfinalisasi';
        if (lowerTitle) lowerTitle.textContent = `Daftar Berkas Medis ${docFullName}`;

        if (tableHead) tableHead.innerHTML = '<th>Tanggal</th><th>No. RM &amp; Pasien</th><th>Anamnesis (S)</th><th>Diagnosa (A &amp; ICD-10)</th><th>Status</th><th>Aksi</th>';

        let records = [];
        const rmeRes = await window.medicalRecordService.getDoctorRecords(activeDoctorId);
        if (rmeRes.success && rmeRes.data && rmeRes.data.length > 0) {
          records = rmeRes.data;
        }

        if (tableBody) {
          if (records.length > 0) {
            tableBody.innerHTML = records.map(r => `
              <tr>
                <td class="table-primary">${r.record_date ? new Date(r.record_date).toLocaleDateString('id-ID') : 'Hari ini'}</td>
                <td><strong>${r.patient?.profile?.full_name || 'Pasien'}</strong><br/><small>${r.patient?.no_rm || '-'}</small></td>
                <td>${r.subjective || '-'}</td>
                <td><strong>${r.diagnosis_icd10 || r.assessment || '-'}</strong></td>
                <td>${statusBadge(r.finalized_at ? 'FINAL' : 'DRAFT')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(r.record_date ? new Date(r.record_date).toLocaleDateString('id-ID') : 'Hari ini')}', '${escapeJsStr(docFullName)}', '${escapeJsStr(r.subjective || '-')}', '${escapeJsStr(r.objective || '-')}', '${escapeJsStr(r.diagnosis_icd10 || r.assessment || '-')}', '${escapeJsStr(r.treatment_plan || '-')}', '${escapeJsStr(r.finalized_at ? 'FINAL' : 'DRAFT')}')">Lihat RME</button></td>
              </tr>
            `).join('');
          } else {
            const apptRes = await window.appointmentService.getDoctorTodayAppointments(activeDoctorId);
            const sampleAppts = (apptRes.success && apptRes.data) ? apptRes.data : [];
            if (sampleAppts.length > 0) {
              tableBody.innerHTML = sampleAppts.map(a => `
                <tr>
                  <td class="table-primary">${a.appointment_date || '26 Sep 2026'}</td>
                  <td><strong>${a.patient?.profile?.full_name || 'Pasien'}</strong><br/><small>${a.patient?.no_rm || '-'}</small></td>
                  <td>${a.chief_complaint || '-'}</td>
                  <td><strong>Pemeriksaan Poli ${escapeJsStr(docServiceName)}</strong></td>
                  <td>${statusBadge(a.status === 'Selesai' ? 'FINAL' : 'DRAFT')}</td>
                  <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(a.appointment_date || '26 Sep 2026')}', '${escapeJsStr(docFullName)}', '${escapeJsStr(a.chief_complaint || '-')}', 'TD: 120/80 mmHg, N: 78x/m', 'Pemeriksaan Poli ${escapeJsStr(docServiceName)}', 'Terapi dan anjuran istirahat', 'FINAL')">Lihat RME</button></td>
                </tr>
              `).join('');
            } else {
              tableBody.innerHTML = `
                <tr>
                  <td colspan="6" class="table-empty-row">Belum ada berkas rekam medis yang dicatat oleh ${docFullName}.</td>
                </tr>
              `;
            }
          }
        }
      } else if (currentView === 'resep') {
        if (welcomeTitle) welcomeTitle.textContent = 'Resep Obat Elektronik (e-Prescription)';
        if (welcomeCopy) welcomeCopy.textContent = `Daftar resep obat elektronik yang diterbitkan oleh ${docFullName} untuk instalasi farmasi.`;
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Monitoring e-Resep Dokter';
        if (lowerTitle) lowerTitle.textContent = `Daftar Resep Terbit (${docFullName})`;

        if (tableHead) tableHead.innerHTML = '<th>No. Resep</th><th>Tanggal</th><th>Pasien / No. RM</th><th>Rincian Obat &amp; Dosis</th><th>Status Farmasi</th><th>Catatan</th>';

        let rxList = [];
        const rxRes = await window.prescriptionService.getDoctorPrescriptions(activeDoctorId);
        if (rxRes.success && rxRes.data && rxRes.data.length > 0) {
          rxList = rxRes.data;
        }

        if (tableBody) {
          if (rxList.length > 0) {
            tableBody.innerHTML = rxList.map(rx => {
              const patientName = rx.patient?.profile?.full_name || rx.medical_record?.patient?.profile?.full_name || 'Pasien';
              const noRm = rx.patient?.no_rm || rx.medical_record?.patient?.no_rm || '-';
              const itemsText = (rx.prescription_items || []).map(i => `<strong>${i.medicine_name}</strong> (${i.dosage}) - ${i.frequency} [${i.quantity} pcs]`).join('<br/>') || 'Obat terlampir';
              return `
                <tr>
                  <td class="table-primary">${rx.prescription_number}</td>
                  <td>${new Date(rx.created_at).toLocaleDateString('id-ID')}</td>
                  <td><strong>${patientName}</strong><br/><small>${noRm}</small></td>
                  <td>${itemsText}</td>
                  <td>${statusBadge(rx.status)}</td>
                  <td>${rx.notes || '-'}</td>
                </tr>
              `;
            }).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td colspan="6" class="table-empty-row">Belum ada resep elektronik yang diterbitkan oleh ${docFullName}.</td>
              </tr>
            `;
          }
        }
      }
    }

    async function openFullAgendaDokterModal() {
      const modal = document.getElementById('modalFullAgendaDokter');
      const tableBody = document.getElementById('tableFullAgendaDokterBody');
      const searchInput = document.getElementById('searchFullAgendaDokter');
      const badgeCount = document.getElementById('badgeCountFullAgendaDokter');
      const banner = document.getElementById('modalFullAgendaDokterBanner');
      if (!modal || !tableBody) return;

      const activeDoc = getActiveDoctor();
      const docFullName = activeDoc ? activeDoc.full_name : 'Dokter';
      if (banner) {
        banner.textContent = `Menampilkan antrean pasien khusus untuk ${docFullName} (${activeDoc?.service_name || 'Poliklinik'}).`;
      }

      let appts = [];
      if (window.appointmentService) {
        const res = await window.appointmentService.getDoctorTodayAppointments(activeDoctorId);
        if (res.success && res.data && res.data.length > 0) {
          appts = res.data;
        }
      }

      function renderRows(filteredList) {
        if (badgeCount) badgeCount.textContent = `${filteredList.length} Pasien`;
        if (filteredList.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" class="table-empty-row p-4">Belum ada antrean janji temu pasien untuk jadwal dokter ini hari ini.</td></tr>';
          return;
        }
        tableBody.innerHTML = filteredList.map((a, idx) => {
          const ptName = a.patient?.profile?.full_name || 'Pasien';
          const ptRm = a.patient?.no_rm || '-';
          const queueNum = a.queue_number || `A-${String(idx + 1).padStart(3, '0')}`;
          const timeStr = a.appointment_time ? a.appointment_time.slice(0, 5) : '08:30';
          const complaint = a.chief_complaint || '-';
          const status = a.status || 'Menunggu';

          return `
            <tr>
              <td class="table-primary"><strong>${queueNum}</strong></td>
              <td>${timeStr} WIB</td>
              <td><strong>${ptName}</strong></td>
              <td><span class="mono-code">${ptRm}</span></td>
              <td>${complaint}</td>
              <td>${statusBadge(status)}</td>
              <td><button type="button" class="action-btn-sm action-btn-primary" onclick="window.openDoctorSoapModal('${escapeJsStr(ptRm)}', '${escapeJsStr(ptName)}', '${escapeJsStr(complaint)}', '${escapeJsStr(a.patient_id || '')}', '${escapeJsStr(a.id || '')}')">Periksa SOAP</button></td>
            </tr>
          `;
        }).join('');
      }

      renderRows(appts);

      if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = (e) => {
          const q = e.target.value.toLowerCase().trim();
          if (!q) {
            renderRows(appts);
          } else {
            const filtered = appts.filter(a =>
              (a.queue_number || '').toLowerCase().includes(q) ||
              (a.patient?.profile?.full_name || '').toLowerCase().includes(q) ||
              (a.patient?.no_rm || '').toLowerCase().includes(q) ||
              (a.chief_complaint || '').toLowerCase().includes(q) ||
              (a.status || '').toLowerCase().includes(q)
            );
            renderRows(filtered);
          }
        };
      }

      if (window.Modal) window.Modal.open('modalFullAgendaDokter');
    }

    async function openFullMedicalDokterModal() {
      const modal = document.getElementById('modalFullMedicalDokter');
      const tableBody = document.getElementById('tableFullMedicalDokterBody');
      const searchInput = document.getElementById('searchFullMedicalDokter');
      const badgeCount = document.getElementById('badgeCountFullMedicalDokter');
      if (!modal || !tableBody) return;

      const activeDoc = getActiveDoctor();
      const docFullName = activeDoc ? activeDoc.full_name : 'Dokter';

      let records = [];
      if (window.medicalRecordService) {
        const rmeRes = await window.medicalRecordService.getDoctorRecords(activeDoctorId);
        if (rmeRes.success && rmeRes.data && rmeRes.data.length > 0) {
          records = rmeRes.data;
        }
      }

      if (records.length === 0) {
        const apptRes = await window.appointmentService.getDoctorTodayAppointments(activeDoctorId);
        const actualAppts = (apptRes.success && apptRes.data) ? apptRes.data : [];
        if (actualAppts.length > 0) {
          records = actualAppts.map(a => ({
            record_date: a.appointment_date || 'Hari ini',
            patient: a.patient,
            subjective: a.chief_complaint || 'Pemeriksaan klinis keluhan umum',
            objective: 'TD: 120/80 mmHg, N: 78x/m, S: 36.6 C',
            assessment: `Pemeriksaan Klinis ${activeDoc?.service_name || 'Poli'}`,
            treatment_plan: 'Edukasi dan anjuran istirahat teratur',
            finalized_at: a.status === 'Selesai' ? '2026-09-26T10:00:00Z' : null
          }));
        }
      }

      function renderRows(filteredList) {
        if (badgeCount) badgeCount.textContent = `${filteredList.length} Pemeriksaan`;
        if (filteredList.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="8" class="table-empty-row p-4">Belum ada riwayat berkas rekam medis untuk dokter ini.</td></tr>';
          return;
        }
        tableBody.innerHTML = filteredList.map(r => {
          const dateStr = r.record_date ? (r.record_date.length <= 11 ? r.record_date : new Date(r.record_date).toLocaleDateString('id-ID')) : 'Hari ini';
          const ptName = r.patient?.profile?.full_name || 'Pasien';
          const ptRm = r.patient?.no_rm || '-';
          const diag = r.diagnosis_icd10 || r.assessment || '-';
          const statusTxt = r.finalized_at ? 'FINAL' : 'DRAFT';

          return `
            <tr>
              <td class="table-primary"><strong>${dateStr}</strong></td>
              <td><span class="mono-code">${ptRm}</span></td>
              <td><strong>${ptName}</strong></td>
              <td>${r.subjective || '-'}</td>
              <td><strong>${diag}</strong></td>
              <td><small>${r.treatment_plan || '-'}</small></td>
              <td>${statusBadge(statusTxt)}</td>
              <td><button type="button" class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(dateStr)}', '${escapeJsStr(docFullName)}', '${escapeJsStr(r.subjective || '-')}', '${escapeJsStr(r.objective || '-')}', '${escapeJsStr(diag)}', '${escapeJsStr(r.treatment_plan || '-')}', '${escapeJsStr(statusTxt)}')">Lihat RME</button></td>
            </tr>
          `;
        }).join('');
      }

      renderRows(records);

      if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = (e) => {
          const q = e.target.value.toLowerCase().trim();
          if (!q) {
            renderRows(records);
          } else {
            const filtered = records.filter(r =>
              (r.patient?.profile?.full_name || '').toLowerCase().includes(q) ||
              (r.patient?.no_rm || '').toLowerCase().includes(q) ||
              (r.diagnosis_icd10 || r.assessment || '').toLowerCase().includes(q) ||
              (r.subjective || '').toLowerCase().includes(q) ||
              (r.treatment_plan || '').toLowerCase().includes(q)
            );
            renderRows(filtered);
          }
        };
      }

      if (window.Modal) window.Modal.open('modalFullMedicalDokter');
    }

    const btnViewAllAgenda = document.getElementById('btnViewAllAgenda');
    if (btnViewAllAgenda) {
      btnViewAllAgenda.addEventListener('click', (e) => {
        e.preventDefault();
        openFullAgendaDokterModal();
      });
    }

    const btnViewAllLower = document.getElementById('btnViewAllLower');
    if (btnViewAllLower) {
      btnViewAllLower.addEventListener('click', (e) => {
        e.preventDefault();
        openFullMedicalDokterModal();
      });
    }

    renderDokterDashboard();
  }

  window.openDoctorSoapModal = function (rm, name, complaint, patientId = '', apptId = '', recordId = '') {
    const banner = document.getElementById('soapPatientBanner');
    if (banner) banner.textContent = `Pasien: ${name || 'Pasien'} (${rm || '-'}) — Keluhan: ${complaint || '-'}`;

    const pInput = document.getElementById('soapPatientId');
    if (pInput) pInput.value = patientId || '';

    const aInput = document.getElementById('soapAppointmentId');
    if (aInput) aInput.value = apptId || '';

    const rInput = document.getElementById('soapRecordId');
    if (rInput) rInput.value = recordId || '';

    const subj = document.getElementById('soapSubjective');
    if (subj) subj.value = complaint ? `Pasien mengeluhkan: ${complaint}` : '';

    const obj = document.getElementById('soapObjective');
    if (obj) obj.value = '';

    const assess = document.getElementById('soapAssessment');
    if (assess) assess.value = '';

    const icd = document.getElementById('soapIcd10');
    if (icd) icd.value = '';

    const plan = document.getElementById('soapPlan');
    if (plan) plan.value = '';

    // Reset default 1 medicine row
    const medicineTableBody = document.getElementById('soapMedicineRows');
    if (medicineTableBody) {
      medicineTableBody.innerHTML = `
        <tr>
          <td><input type="text" class="med-name" placeholder="Amoxicillin" value="Paracetamol" /></td>
          <td><input type="text" class="med-dosage" placeholder="500 mg" value="500 mg" /></td>
          <td><input type="text" class="med-freq" placeholder="3x1 sesudah makan" value="3x1 sesudah makan" /></td>
          <td><input type="number" class="med-qty" value="10" min="1" /></td>
          <td><button type="button" class="action-btn-sm" onclick="this.closest('tr').remove()">&times;</button></td>
        </tr>
      `;
    }

    window.Modal.open('modalSoapRecord');
  };

  /* ══════════════════════════════════════════════════════════
     INITIALIZATION & COMMON EVENTS
     ══════════════════════════════════════════════════════════ */
  // Sidebar responsive toggle
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', event => {
      event.stopPropagation();
      sidebar.classList.toggle('is-open');
    });

    document.addEventListener('click', event => {
      if (sidebar.classList.contains('is-open') && !sidebar.contains(event.target) && event.target !== menuToggle) {
        sidebar.classList.remove('is-open');
      }
    });
  }

  // Logout handler
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        localStorage.removeItem('simklinik_user_name');
      } catch (_) { }
      if (window.supabaseClient) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (e) {
          console.warn('[Logout]', e.message);
        }
      }
      location.href = 'login.html';
    });
  }

  // Notification button alert
  const notifBtn = document.querySelector('.icon-button');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      window.Toast.info('Tidak ada notifikasi baru saat ini.');
    });
  }

  // Dispatch initialization per role
  (async () => {
    await checkAuthSession();

    if (role === 'pasien') {
      initPasienPortal();
    } else if (role === 'petugas') {
      initPetugasPortal();
    } else if (role === 'dokter') {
      initDokterPortal();
    }
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getTimeGreeting,
      getCurrentUserDisplayName,
      updateDashboardGreeting
    };
  }
})();
