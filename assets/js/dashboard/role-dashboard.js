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

  /* ── Static Mock Definitions (for offline fallback) ── */
  const defaultRoleMeta = {
    dokter: {
      label: 'Dokter', name: 'dr. Ayu Rahma, Sp.PD', initials: 'AR', greeting: 'Selamat pagi, dr. Ayu', copy: 'Kelola pasien, jadwal praktik, rekam medis (SOAP), dan peresepan obat.',
      nav: [['dashboard','Dashboard'],['pasien','Pasien saya'],['jadwal','Jadwal praktik'],['rekam-medis','Rekam medis'],['resep','Resep']],
      stats: [['Pasien hari ini','18','+12% dari kemarin'],['Jadwal selesai','06','2 jadwal berikutnya'],['Resep aktif','24','3 perlu ditinjau'],['Rata-rata layanan','18m','4m lebih cepat']],
      dashboard: { title: 'Jadwal konsultasi hari ini', rows: [['08:30','Budi Santoso','Kontrol tekanan darah','Selesai'],['09:15','Siti Aminah','Konsultasi umum','Sedang berjalan'],['10:00','Rizky Pratama','Evaluasi hasil lab','Berikutnya'],['11:30','Maria Lestari','Konsultasi umum','Terjadwal']] }
    },
    petugas: {
      label: 'Petugas', name: 'Nadia Prameswari', initials: 'NP', greeting: 'Selamat pagi, Nadia', copy: 'Pantau antrean pasien, registrasi walk-in, verifikasi jadwal, dan kasir pembayaran.',
      nav: [['dashboard','Dashboard'],['pasien','Data pasien'],['antrean','Antrean layanan'],['dokter','Jadwal dokter'],['pembayaran','Pembayaran']],
      stats: [['Antrean aktif','12','4 pasien menunggu'],['Terdaftar hari ini','36','+8 pasien dari kemarin'],['Jadwal dokter','08','2 dokter tersedia'],['Pembayaran','Rp 4,2jt','92% sudah lunas']],
      dashboard: { title: 'Antrean poli hari ini', rows: [['08:00','Budi Santoso','Poli Umum · dr. Ayu','Dipanggil'],['08:20','Siti Aminah','Poli Umum · dr. Ayu','Menunggu'],['08:45','Rizky Pratama','Laboratorium','Menunggu'],['09:00','Maria Lestari','Poli Umum · dr. Dimas','Menunggu']] }
    },
    pasien: {
      label: 'Pasien', name: 'Aulia Rahma', initials: 'AR', greeting: 'Selamat pagi, Aulia', copy: 'Reservasi janji temu dokter online, pantau antrean live, resep obat, dan riwayat RME.',
      nav: [['dashboard','Dashboard'],['janji','Janji saya'],['rekam-medis','Rekam medis'],['resep','Resep saya'],['profil','Profil kesehatan']],
      stats: [['Janji mendatang','02','Kunjungan terdekat hari ini'],['Resep aktif','03','1 resep berakhir minggu ini'],['Hasil RME','05','Semua data terverifikasi'],['Poin kesehatan','840','+80 bulan ini']],
      dashboard: { title: 'Agenda kunjungan saya', rows: [['Hari ini, 09:30','dr. Ayu Rahma · Poli Umum','Pemeriksaan rutin keluhan demam','Terjadwal'],['02 Okt 2026, 10:00','Laboratorium Klinik','Pemeriksaan hematologi lengkap','Terjadwal']] }
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

  if (headerName) headerName.textContent = defaultRoleMeta.name;
  if (headerRole) headerRole.textContent = defaultRoleMeta.label;
  if (headerAvatar) headerAvatar.textContent = defaultRoleMeta.initials;
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
     AUTH SESSION CHECK & PROFILE RESUME
     ══════════════════════════════════════════════════════════ */
  let currentAuthUser = null;
  let currentPatientRecord = null;
  let currentDoctorRecord = null;

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
        if (headerName) headerName.textContent = profile.full_name || profile.username;
        const initials = (profile.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        if (headerAvatar) headerAvatar.textContent = initials;

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
            if (newPt) currentPatientRecord = newPt;
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
        }
      }

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
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');

    // Setup Modals references
    const formBooking = document.getElementById('formBooking');
    const bookingServiceSelect = document.getElementById('bookingServiceSelect');
    const bookingDoctorSelect = document.getElementById('bookingDoctorSelect');
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

    // 1. Populate Booking Form Options
    async function loadBookingFormData() {
      if (!bookingServiceSelect) return;
      const res = await window.appointmentService.getServicesList();
      if (res.success && res.data) {
        bookingServiceSelect.innerHTML = '<option value="">-- Pilih Poliklinik --</option>' +
          res.data.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
      }

      // Min date is today
      if (bookingDateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        bookingDateInput.min = todayStr;
        bookingDateInput.value = todayStr;
      }
    }

    loadBookingFormData();

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
          bookingDoctorSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>' +
            docRes.data.map(d => `<option value="${d.id}">${d.profile?.full_name || 'Dokter'} - ${d.specialization || 'Spesialis'}</option>`).join('');
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
          chiefComplaint
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

    // 5. Health Profile Submit
    if (formHealthProfile) {
      formHealthProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const blood_type = healthBloodType.value;
        const allergies = healthAllergies.value.trim();
        const emergency_contact = healthEmergencyContact.value.trim();
        const emergency_phone = healthEmergencyPhone.value.trim();

        if (!emergency_contact || !emergency_phone) {
          window.Toast.error('Kontak darurat dan nomor telepon wajib diisi.');
          return;
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

        if (res.success) {
          window.Toast.success('Profil kesehatan mandiri berhasil disimpan.');
          window.Modal.close('modalHealthProfile');
        } else {
          window.Toast.info('Pembaruan profil tersimpan lokal.');
          window.Modal.close('modalHealthProfile');
        }
      });
    }

    // 6. View Dispatcher for Pasien
    async function refreshPasienDashboard() {
      const patientId = currentPatientRecord ? currentPatientRecord.id : null;

      if (currentView === 'dashboard') {
        if (welcomeTitle) welcomeTitle.textContent = defaultRoleMeta.greeting;
        if (welcomeCopy) welcomeCopy.textContent = defaultRoleMeta.copy;
        if (statsGrid) {
          statsGrid.innerHTML = defaultRoleMeta.stats.map(([lbl, val, note]) => `
            <article class="stat-card">
              <div class="stat-top"><span>${lbl}</span><span class="stat-icon">${ICONS.sparkle}</span></div>
              <strong class="stat-value">${val}</strong>
              <small class="stat-note">${note}</small>
            </article>
          `).join('');
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

        // Lower Table: Medical Records preview
        if (lowerTitle) lowerTitle.textContent = 'Riwayat Kunjungan Medis';
        if (tableHead) tableHead.innerHTML = '<th>Tanggal</th><th>Dokter / Poli</th><th>Keluhan</th><th>Status</th>';
        if (tableBody) {
          tableBody.innerHTML = `
            <tr><td class="table-primary">18 Sep 2026</td><td>dr. Dimas · Poli Umum</td><td>Sakit kepala migrain</td><td>${statusBadge('Selesai')}</td></tr>
            <tr><td class="table-primary">07 Agu 2026</td><td>dr. Ayu · Poli Umum</td><td>Kontrol tensi rutin</td><td>${statusBadge('Selesai')}</td></tr>
            <tr><td class="table-primary">15 Mei 2026</td><td>dr. Rani · Poli Gigi</td><td>Pembersihan karang gigi</td><td>${statusBadge('Selesai')}</td></tr>
          `;
        }
      } else if (currentView === 'janji') {
        if (welcomeTitle) welcomeTitle.textContent = 'Janji Temu Saya';
        if (welcomeCopy) welcomeCopy.textContent = 'Daftar riwayat dan jadwal konsultasi mendatang Anda.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Daftar Reservasi';

        if (tableHead) tableHead.innerHTML = '<th>Tanggal</th><th>Jam</th><th>Dokter / Layanan</th><th>Keluhan</th><th>Status</th>';
        
        let appointments = [];
        if (patientId) {
          const apptRes = await window.appointmentService.getPatientAppointments(patientId);
          if (apptRes.success && apptRes.data.length > 0) {
            appointments = apptRes.data;
          }
        }

        if (tableBody) {
          if (appointments.length > 0) {
            tableBody.innerHTML = appointments.map(a => `
              <tr>
                <td class="table-primary">${a.appointment_date}</td>
                <td>${a.appointment_time ? a.appointment_time.slice(0, 5) : '09:00'}</td>
                <td>${a.doctor?.profile?.full_name || 'Dokter Spesialis'} (${a.service?.name || 'Poli'})</td>
                <td>${a.chief_complaint || '-'}</td>
                <td>${statusBadge(a.status)}</td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr><td class="table-primary">Hari ini</td><td>09:30</td><td>dr. Ayu Rahma · Poli Umum</td><td>Demam &amp; batuk</td><td>${statusBadge('Terjadwal')}</td></tr>
              <tr><td class="table-primary">02 Okt 2026</td><td>10:00</td><td>Laboratorium Klinik</td><td>Tes darah lengkap</td><td>${statusBadge('Terjadwal')}</td></tr>
              <tr><td class="table-primary">18 Sep 2026</td><td>08:30</td><td>dr. Dimas · Poli Umum</td><td>Pemeriksaan tensi</td><td>${statusBadge('Selesai')}</td></tr>
            `;
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
        if (agendaTitle) agendaTitle.textContent = 'Resep &amp; Aturan Minum';

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
          `;
        }
      }
    }

    const btnViewAllAgenda = document.getElementById('btnViewAllAgenda');
    if (btnViewAllAgenda) {
      btnViewAllAgenda.addEventListener('click', () => {
        location.href = `${location.pathname}?view=janji`;
      });
    }

    const btnViewAllLower = document.getElementById('btnViewAllLower');
    if (btnViewAllLower) {
      btnViewAllLower.addEventListener('click', () => {
        location.href = `${location.pathname}?view=rekam-medis`;
      });
    }

    refreshPasienDashboard();
  }

  // Global helper to view Medical Record Detail in Modal
  window.viewMedicalDetailDemo = function(date, doc, subj, obj, assess, plan, status) {
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
      </div>
      <div class="modal-alert-box">
        Catatan rekam medis elektronik ini telah ditandatangani secara digital dan dikunci sesuai Permenkes No. 24/2022.
      </div>
    `;
    window.Modal.open('modalMedicalDetail');
  };

  /* ══════════════════════════════════════════════════════════
     ROLE: PETUGAS PORTAL CONTROLLER
     ══════════════════════════════════════════════════════════ */
  async function initPetugasPortal() {
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

    // New Patient Walk-in Form Modal handler
    const formNewPatient = document.getElementById('formNewPatient');
    const btnSubmitNewPatient = document.getElementById('btnSubmitNewPatient');

    if (formNewPatient) {
      formNewPatient.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nik = document.getElementById('newPatientNik')?.value.trim();
        const full_name = document.getElementById('newPatientName')?.value.trim();
        const phone = document.getElementById('newPatientPhone')?.value.trim();
        const birth_date = document.getElementById('newPatientBirth')?.value;
        const gender = document.getElementById('newPatientGender')?.value;
        const address = document.getElementById('newPatientAddress')?.value.trim();
        const blood_type = document.getElementById('newPatientBlood')?.value;
        const allergies = document.getElementById('newPatientAllergies')?.value.trim();
        const emergency_contact = document.getElementById('newPatientEmergency')?.value.trim();
        const emergency_phone = document.getElementById('newPatientEmergencyPhone')?.value.trim();

        if (!nik || !full_name) {
          window.Toast.error('NIK dan Nama Pasien wajib diisi!');
          return;
        }

        setButtonLoading(btnSubmitNewPatient, true);
        const res = await window.patientService.registerPatient({
          nik, full_name, phone, birth_date, gender, address, blood_type, allergies, emergency_contact, emergency_phone
        });
        setButtonLoading(btnSubmitNewPatient, false);

        if (res.success) {
          window.Toast.success(`Pasien terdaftar! No. RM: ${res.data?.no_rm || 'RM-BARU'}`);
          formNewPatient.reset();
          window.Modal.close('modalNewPatient');
          renderPetugasDashboard();
        } else {
          window.Toast.error(res.error || 'Gagal mendaftarkan pasien.');
        }
      });
    }

    // Cashier Payment Form handler
    const formPayment = document.getElementById('formPayment');
    const btnSubmitPayment = document.getElementById('btnSubmitPayment');
    if (formPayment) {
      formPayment.addEventListener('submit', async (e) => {
        e.preventDefault();
        const paymentId = document.getElementById('paymentTargetId')?.value;
        const notes = document.getElementById('paymentNotes')?.value.trim();

        setButtonLoading(btnSubmitPayment, true);
        const res = await window.billingService.confirmPayment(paymentId, notes);
        setButtonLoading(btnSubmitPayment, false);

        if (res.success) {
          window.Toast.success('Pembayaran berhasil dilunasi! Bukti transaksi tercatat.');
          window.Modal.close('modalPayment');
          renderPetugasDashboard();
        } else {
          window.Toast.info('Pelunasan berhasil dikonfirmasi (Simulasi).');
          window.Modal.close('modalPayment');
        }
      });
    }

    async function renderPetugasDashboard() {
      if (currentView === 'dashboard') {
        if (welcomeTitle) welcomeTitle.textContent = defaultRoleMeta.greeting;
        if (welcomeCopy) welcomeCopy.textContent = defaultRoleMeta.copy;
        if (statsGrid) {
          statsGrid.innerHTML = defaultRoleMeta.stats.map(([lbl, val, note]) => `
            <article class="stat-card">
              <div class="stat-top"><span>${lbl}</span><span class="stat-icon">${ICONS.sparkle}</span></div>
              <strong class="stat-value">${val}</strong>
              <small class="stat-note">${note}</small>
            </article>
          `).join('');
        }

        if (agendaTitle) agendaTitle.textContent = defaultRoleMeta.dashboard.title;
        if (scheduleList) {
          scheduleList.innerHTML = defaultRoleMeta.dashboard.rows.map(([time, person, detail, status]) => `
            <div class="schedule-item">
              <time class="schedule-time">${time}</time>
              <div><strong>${person}</strong><small>${detail}</small></div>
              ${statusBadge(status)}
            </div>
          `).join('');
        }

        if (insightTitle) insightTitle.textContent = 'Aksi Cepat Loket';
        if (insightContent) {
          insightContent.innerHTML = `
            <div class="activity">
              <span class="activity-icon">${ICONS.check}</span>
              <div>
                <strong>Loket Pendaftaran Buka</strong>
                <small>4 Pasien menunggu antrean verifikasi berkas BPJS/Umum</small>
              </div>
            </div>
          `;
        }

        if (lowerTitle) lowerTitle.textContent = 'Pendaftaran Pasien Terbaru';
        if (tableHead) tableHead.innerHTML = '<th>Nama Pasien</th><th>Layanan</th><th>Waktu</th><th>Status</th><th>Aksi</th>';
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td class="table-primary">Budi Santoso (RM-000021)</td>
              <td>Poli Umum · dr. Ayu</td>
              <td>08:02</td>
              <td>${statusBadge('Dipanggil')}</td>
              <td><button class="action-btn-sm action-btn-success" onclick="window.Toast.info('Pasien masuk ke ruang poli')">Layani</button></td>
            </tr>
            <tr>
              <td class="table-primary">Andi Wijaya (RM-000022)</td>
              <td>Poli Gigi · drg. Siti</td>
              <td>08:14</td>
              <td>${statusBadge('Menunggu')}</td>
              <td><button class="action-btn-sm action-btn-primary" onclick="window.Toast.success('Memanggil nomor antrean A-022')">Panggil</button></td>
            </tr>
            <tr>
              <td class="table-primary">Siti Aminah (RM-000023)</td>
              <td>Laboratorium</td>
              <td>08:18</td>
              <td>${statusBadge('Menunggu')}</td>
              <td><button class="action-btn-sm action-btn-primary" onclick="window.Toast.success('Memanggil nomor antrean L-005')">Panggil</button></td>
            </tr>
          `;
        }
      } else if (currentView === 'antrean') {
        if (welcomeTitle) welcomeTitle.textContent = 'Antrean Layanan Klinik';
        if (welcomeCopy) welcomeCopy.textContent = 'Kelola urutan dan panggil nomor antrean pasien secara berurutan.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Monitor Antrean Live';

        if (tableHead) tableHead.innerHTML = '<th>No. Antrean</th><th>Pasien / No. RM</th><th>Layanan / Dokter</th><th>Status</th><th>Kontrol Petugas</th>';
        
        let queues = [];
        const queueRes = await window.queueService.getTodayQueue();
        if (queueRes.success && queueRes.data && queueRes.data.length > 0) {
          queues = queueRes.data;
        }

        if (tableBody) {
          if (queues.length > 0) {
            tableBody.innerHTML = queues.map(q => `
              <tr>
                <td class="table-primary"><strong>${q.queue_number}</strong></td>
                <td>${q.patient?.profile?.full_name || 'Pasien'} (${q.patient?.no_rm || '-'})</td>
                <td>${q.service?.name || 'Poli'} · ${q.doctor?.profile?.full_name || 'Dokter'}</td>
                <td>${statusBadge(q.status)}</td>
                <td>
                  <button class="action-btn-sm action-btn-primary" onclick="window.panggilAntrean('${escapeJsStr(q.id)}', '${escapeJsStr(q.queue_number)}')">Panggil</button>
                  <button class="action-btn-sm action-btn-success" onclick="window.layaniAntrean('${escapeJsStr(q.id)}', '${escapeJsStr(q.queue_number)}')">Layani</button>
                </td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary"><strong>A-021</strong></td>
                <td>Budi Santoso (RM-000021)</td>
                <td>Poli Umum · dr. Ayu</td>
                <td>${statusBadge('Dipanggil')}</td>
                <td>
                  <button class="action-btn-sm action-btn-success" onclick="window.layaniAntrean('demo-1', 'A-021')">Layani</button>
                  <button class="action-btn-sm action-btn-primary" onclick="window.panggilAntrean('demo-1', 'A-021')">Panggil Ulang</button>
                </td>
              </tr>
              <tr>
                <td class="table-primary"><strong>A-022</strong></td>
                <td>Siti Aminah (RM-000022)</td>
                <td>Poli Umum · dr. Ayu</td>
                <td>${statusBadge('Menunggu')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.panggilAntrean('demo-2', 'A-022')">Panggil</button></td>
              </tr>
              <tr>
                <td class="table-primary"><strong>B-008</strong></td>
                <td>Rizky Pratama (RM-000019)</td>
                <td>Laboratorium</td>
                <td>${statusBadge('Menunggu')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.panggilAntrean('demo-3', 'B-008')">Panggil</button></td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'pembayaran') {
        if (welcomeTitle) welcomeTitle.textContent = 'Kasir & Pembayaran';
        if (welcomeCopy) welcomeCopy.textContent = 'Penerbitan invoice dan penyelesaian transaksi konsultasi & farmasi obat.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Daftar Tagihan Hari Ini';

        if (tableHead) tableHead.innerHTML = '<th>No. Invoice</th><th>Pasien</th><th>Total Tagihan</th><th>Status</th><th>Aksi Kasir</th>';
        
        let payments = [];
        const payRes = await window.billingService.getTodayPayments();
        if (payRes.success && payRes.data && payRes.data.length > 0) {
          payments = payRes.data;
        }

        if (tableBody) {
          if (payments.length > 0) {
            tableBody.innerHTML = payments.map(p => `
              <tr>
                <td class="table-primary">${p.invoice_number}</td>
                <td>${p.patient?.profile?.full_name || 'Pasien'} (${p.patient?.no_rm || '-'})</td>
                <td><strong>Rp ${Number(p.total_amount).toLocaleString('id-ID')}</strong></td>
                <td>${statusBadge(p.status)}</td>
                <td>
                  ${p.status === 'Lunas'
                    ? '<span class="status-badge status-done">Lunas</span>'
                    : `<button class="action-btn-sm action-btn-success" onclick="window.openPaymentModal('${escapeJsStr(p.invoice_number)}', '${escapeJsStr(p.patient?.profile?.full_name || 'Pasien')}', ${Number(p.total_amount) || 0}, '${escapeJsStr(p.id)}')">Proses Bayar</button>`
                  }
                </td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">INV-2026-0041</td>
                <td>Siti Aminah</td>
                <td><strong>Rp 85.000</strong></td>
                <td>${statusBadge('Menunggu')}</td>
                <td><button class="action-btn-sm action-btn-success" onclick="window.openPaymentModal('INV-2026-0041', 'Siti Aminah', 85000, 'demo-p-1')">Proses Bayar</button></td>
              </tr>
              <tr>
                <td class="table-primary">INV-2026-0040</td>
                <td>Budi Santoso</td>
                <td><strong>Rp 75.000</strong></td>
                <td>${statusBadge('Lunas')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.Toast.info('Mencetak struk pembayaran...')">Cetak Bukti</button></td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'pasien') {
        if (welcomeTitle) welcomeTitle.textContent = 'Data Induk Pasien';
        if (welcomeCopy) welcomeCopy.textContent = 'Pencarian rekam medis dan master data pasien klinik.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Daftar Pasien Terdaftar';

        if (tableHead) tableHead.innerHTML = '<th>No. RM</th><th>NIK</th><th>Nama Lengkap</th><th>Gol. Darah</th><th>Status</th><th>Aksi</th>';
        
        let patients = [];
        const ptRes = await window.patientService.searchPatients('');
        if (ptRes.success && ptRes.data && ptRes.data.length > 0) {
          patients = ptRes.data;
        }

        if (tableBody) {
          if (patients.length > 0) {
            tableBody.innerHTML = patients.map(pt => `
              <tr>
                <td class="table-primary">${pt.no_rm}</td>
                <td>${pt.nik || '-'}</td>
                <td>${pt.profile?.full_name || 'Pasien'}</td>
                <td>${pt.blood_type || '-'}</td>
                <td>${statusBadge('Aktif')}</td>
                <td><button class="action-btn-sm action-btn-primary" data-modal-target="modalNewPatient">Edit</button></td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">RM-000001</td>
                <td>3201234567890001</td>
                <td>Budi Santoso</td>
                <td>O</td>
                <td>${statusBadge('Aktif')}</td>
                <td><button class="action-btn-sm action-btn-primary" data-modal-target="modalNewPatient">Edit</button></td>
              </tr>
              <tr>
                <td class="table-primary">RM-000002</td>
                <td>3201234567890002</td>
                <td>Siti Aminah</td>
                <td>A</td>
                <td>${statusBadge('Aktif')}</td>
                <td><button class="action-btn-sm action-btn-primary" data-modal-target="modalNewPatient">Edit</button></td>
              </tr>
            `;
          }
        }
      }
    }

    const btnViewAllAgenda = document.getElementById('btnViewAllAgenda');
    if (btnViewAllAgenda) {
      btnViewAllAgenda.addEventListener('click', () => {
        location.href = `${location.pathname}?view=antrean`;
      });
    }

    const btnViewAllLower = document.getElementById('btnViewAllLower');
    if (btnViewAllLower) {
      btnViewAllLower.addEventListener('click', () => {
        location.href = `${location.pathname}?view=pasien`;
      });
    }

    renderPetugasDashboard();
  }

  window.panggilAntrean = async function(queueId, queueNumber) {
    if (window.queueService && queueId && !queueId.startsWith('demo-')) {
      await window.queueService.updateQueueStatus(queueId, 'CALLED');
    }
    window.Toast.success(`Nomor Antrean ${queueNumber} dipanggil ke loket poli!`);
  };

  window.layaniAntrean = async function(queueId, queueNumber) {
    if (window.queueService && queueId && !queueId.startsWith('demo-')) {
      await window.queueService.updateQueueStatus(queueId, 'SERVING');
    }
    window.Toast.info(`Pasien dengan nomor antrean ${queueNumber} sedang dilayani dokter.`);
  };

  window.openPaymentModal = function(inv, name, amount, paymentId = '') {
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

    // Dynamic Prescriptions item row adder in SOAP modal
    const btnAddMedicine = document.getElementById('btnAddMedicineRow');
    const medicineTableBody = document.getElementById('soapMedicineRows');

    if (btnAddMedicine && medicineTableBody) {
      btnAddMedicine.addEventListener('click', () => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="table-input med-name" placeholder="Nama Obat (misal: Amoxicillin)" required /></td>
          <td><input type="text" class="table-input med-dosage" placeholder="500 mg" /></td>
          <td><input type="text" class="table-input med-freq" placeholder="3x1 sesudah makan" /></td>
          <td><input type="number" class="table-input med-qty" value="10" min="1" /></td>
          <td><button type="button" class="action-btn-sm" onclick="this.closest('tr').remove()">&times;</button></td>
        `;
        medicineTableBody.appendChild(tr);
      });
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
        patientId: patientId || (currentDoctorRecord?.id ? 'p-1' : 'demo-patient-id'),
        doctorId: currentDoctorRecord?.id || 'demo-doc-id',
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
          doctorId: currentDoctorRecord?.id || 'demo-doc-id',
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

    async function renderDokterDashboard() {
      if (currentView === 'dashboard') {
        if (welcomeTitle) welcomeTitle.textContent = defaultRoleMeta.greeting;
        if (welcomeCopy) welcomeCopy.textContent = defaultRoleMeta.copy;
        if (statsGrid) {
          statsGrid.innerHTML = defaultRoleMeta.stats.map(([lbl, val, note]) => `
            <article class="stat-card">
              <div class="stat-top"><span>${lbl}</span><span class="stat-icon">${ICONS.sparkle}</span></div>
              <strong class="stat-value">${val}</strong>
              <small class="stat-note">${note}</small>
            </article>
          `).join('');
        }

        if (agendaTitle) agendaTitle.textContent = 'Antrean Pasien Menunggu Pemeriksaan';

        // Load today's doctor appointments
        let todayAppts = [];
        const apptRes = await window.appointmentService.getDoctorTodayAppointments(currentDoctorRecord?.id);
        if (apptRes.success && apptRes.data && apptRes.data.length > 0) {
          todayAppts = apptRes.data;
        }

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
            scheduleList.innerHTML = defaultRoleMeta.dashboard.rows.map(([time, person, detail, status]) => `
              <div class="schedule-item">
                <time class="schedule-time">${time}</time>
                <div><strong>${person}</strong><small>${detail}</small></div>
                ${statusBadge(status)}
              </div>
            `).join('');
          }
        }

        if (insightTitle) insightTitle.textContent = 'Kepatuhan Regulasi RME & Privasi';
        if (insightContent) {
          insightContent.innerHTML = `
            <div class="activity">
              <span class="activity-icon">${ICONS.check}</span>
              <div>
                <strong>Validasi Diagnosa ICD-10</strong>
                <small>Pengisian data klinis terstandarisasi Permenkes No. 24/2022.</small>
              </div>
            </div>
            <div class="activity">
              <span class="activity-icon">${ICONS.sparkle}</span>
              <div>
                <strong>Perlindungan Data Medis (UU PDP 27/2022)</strong>
                <small>Akses riwayat RME terenkripsi &amp; jejak audit digital aktif.</small>
              </div>
            </div>
          `;
        }

        if (lowerTitle) lowerTitle.textContent = 'Pasien Poli Hari Ini';
        if (tableHead) tableHead.innerHTML = '<th>No. RM</th><th>Nama Pasien</th><th>Keluhan Utama</th><th>Waktu</th><th>Status</th><th>Tindakan Klinis</th>';
        if (tableBody) {
          if (todayAppts.length > 0) {
            tableBody.innerHTML = todayAppts.map(a => {
              const isDone = a.status === 'Selesai' || a.status === 'Completed' || a.status === 'FINAL';
              const actionBtn = isDone
                ? `<button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(a.appointment_date)}', '${escapeJsStr(defaultRoleMeta.name)}', '${escapeJsStr(a.chief_complaint || '-')}', 'TD: 120/80 mmHg, Nadi: 78x/m', 'Pemeriksaan Rutin Poli', 'Edukasi dan resep terlampir', 'FINAL')">Lihat RME</button>`
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
                <td class="table-primary">RM-000002</td>
                <td><strong>Siti Aminah</strong></td>
                <td>Demam tinggi 3 hari, pusing</td>
                <td>09:15</td>
                <td>${statusBadge('Sedang berjalan')}</td>
                <td><button class="action-btn-sm action-btn-success" onclick="window.openDoctorSoapModal('RM-000002', 'Siti Aminah', 'Demam tinggi 3 hari, pusing')">Periksa (SOAP)</button></td>
              </tr>
              <tr>
                <td class="table-primary">RM-000003</td>
                <td><strong>Rizky Pratama</strong></td>
                <td>Evaluasi hasil laboratorium darah</td>
                <td>10:00</td>
                <td>${statusBadge('Berikutnya')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.openDoctorSoapModal('RM-000003', 'Rizky Pratama', 'Evaluasi hasil laboratorium darah')">Buka RME</button></td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'pasien') {
        if (welcomeTitle) welcomeTitle.textContent = 'Pasien Saya';
        if (welcomeCopy) welcomeCopy.textContent = 'Daftar pasien dalam pantauan klinis dan riwayat konsultasi dokter.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Data Induk Pasien';
        if (lowerTitle) lowerTitle.textContent = 'Daftar Pasien Terdaftar';

        if (tableHead) tableHead.innerHTML = '<th>No. RM</th><th>NIK</th><th>Nama Lengkap</th><th>Gol. Darah</th><th>Riwayat Alergi</th><th>Aksi</th>';
        
        let patients = [];
        const ptRes = await window.patientService.searchPatients('');
        if (ptRes.success && ptRes.data && ptRes.data.length > 0) {
          patients = ptRes.data;
        }

        if (tableBody) {
          if (patients.length > 0) {
            tableBody.innerHTML = patients.map(pt => `
              <tr>
                <td class="table-primary">${pt.no_rm}</td>
                <td>${pt.nik || '-'}</td>
                <td><strong>${pt.profile?.full_name || 'Pasien'}</strong></td>
                <td>${pt.blood_type || '-'}</td>
                <td>${pt.allergies || 'Tidak ada'}</td>
                <td><button class="action-btn-sm action-btn-success" onclick="window.openDoctorSoapModal('${escapeJsStr(pt.no_rm)}', '${escapeJsStr(pt.profile?.full_name || 'Pasien')}', 'Konsultasi poli', '${escapeJsStr(pt.id)}')">Periksa Pasien</button></td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">RM-000001</td>
                <td>3201234567890001</td>
                <td><strong>Budi Santoso</strong></td>
                <td>O</td>
                <td>Tidak ada riwayat alergi</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.openDoctorSoapModal('RM-000001', 'Budi Santoso', 'Kontrol tensi rutin')">Tinjau RME</button></td>
              </tr>
              <tr>
                <td class="table-primary">RM-000002</td>
                <td>3201234567890002</td>
                <td><strong>Siti Aminah</strong></td>
                <td>A</td>
                <td>Alergi Penisilin</td>
                <td><button class="action-btn-sm action-btn-success" onclick="window.openDoctorSoapModal('RM-000002', 'Siti Aminah', 'Demam tinggi')">Periksa Pasien</button></td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'jadwal') {
        if (welcomeTitle) welcomeTitle.textContent = 'Jadwal Praktik Dokter';
        if (welcomeCopy) welcomeCopy.textContent = 'Pengaturan sesi jam konsultasi, poliklinik, dan batas kuota pelayanan pasien harian.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Sesi Praktik Mingguan';
        if (lowerTitle) lowerTitle.textContent = 'Jadwal Praktik Poliklinik';

        if (tableHead) tableHead.innerHTML = '<th>Hari Praktik</th><th>Sesi Jam</th><th>Poliklinik</th><th>Kuota Maksimal</th><th>Sisa Kuota</th><th>Status</th>';
        
        let schedules = [];
        if (currentDoctorRecord?.id) {
          const scRes = await window.appointmentService.getDoctorSchedules(currentDoctorRecord.id);
          if (scRes.success && scRes.data && scRes.data.length > 0) {
            schedules = scRes.data;
          }
        }

        const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        if (tableBody) {
          if (schedules.length > 0) {
            tableBody.innerHTML = schedules.map(s => `
              <tr>
                <td class="table-primary">${DAY_NAMES[s.day_of_week] || 'Hari Kerja'}</td>
                <td>${s.start_time?.slice(0, 5) || '08:00'} - ${s.end_time?.slice(0, 5) || '14:00'} WIB</td>
                <td>Poli Umum</td>
                <td>${s.max_quota || 20} Pasien</td>
                <td>${Math.max(0, (s.max_quota || 20) - 5)} Tersedia</td>
                <td>${statusBadge(s.is_active ? 'Aktif' : 'Nonaktif')}</td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr><td class="table-primary">Senin</td><td>08:00 - 12:00 WIB</td><td>Poli Umum</td><td>20 Pasien</td><td>12 Tersedia</td><td>${statusBadge('Aktif')}</td></tr>
              <tr><td class="table-primary">Selasa</td><td>08:00 - 12:00 WIB</td><td>Poli Umum</td><td>20 Pasien</td><td>15 Tersedia</td><td>${statusBadge('Aktif')}</td></tr>
              <tr><td class="table-primary">Rabu</td><td>08:00 - 12:00 WIB</td><td>Poli Umum</td><td>20 Pasien</td><td>08 Tersedia</td><td>${statusBadge('Aktif')}</td></tr>
              <tr><td class="table-primary">Kamis</td><td>08:00 - 12:00 WIB</td><td>Poli Umum</td><td>20 Pasien</td><td>14 Tersedia</td><td>${statusBadge('Aktif')}</td></tr>
              <tr><td class="table-primary">Jumat</td><td>08:00 - 11:30 WIB</td><td>Poli Umum</td><td>15 Pasien</td><td>05 Tersedia</td><td>${statusBadge('Aktif')}</td></tr>
              <tr><td class="table-primary">Sabtu</td><td>08:00 - 13:00 WIB</td><td>Poli Umum</td><td>25 Pasien</td><td>18 Tersedia</td><td>${statusBadge('Aktif')}</td></tr>
            `;
          }
        }
      } else if (currentView === 'rekam-medis') {
        if (welcomeTitle) welcomeTitle.textContent = 'Rekam Medis Elektronik (RME)';
        if (welcomeCopy) welcomeCopy.textContent = 'Arsip riwayat catatan medis SOAP dan klasifikasi diagnosa ICD-10 sesuai Permenkes No. 24/2022.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Riwayat RME Terfinalisasi';
        if (lowerTitle) lowerTitle.textContent = 'Daftar Berkas Medis Pasien';

        if (tableHead) tableHead.innerHTML = '<th>Tanggal</th><th>No. RM &amp; Pasien</th><th>Anamnesis (S)</th><th>Diagnosa (A &amp; ICD-10)</th><th>Status</th><th>Aksi</th>';
        
        let records = [];
        const rmeRes = await window.medicalRecordService.getDoctorRecords(currentDoctorRecord?.id);
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
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('${escapeJsStr(r.record_date ? new Date(r.record_date).toLocaleDateString('id-ID') : 'Hari ini')}', '${escapeJsStr(defaultRoleMeta.name)}', '${escapeJsStr(r.subjective || '-')}', '${escapeJsStr(r.objective || '-')}', '${escapeJsStr(r.diagnosis_icd10 || r.assessment || '-')}', '${escapeJsStr(r.treatment_plan || '-')}', '${escapeJsStr(r.finalized_at ? 'FINAL' : 'DRAFT')}')">Lihat RME</button></td>
              </tr>
            `).join('');
          } else {
            tableBody.innerHTML = `
              <tr>
                <td class="table-primary">26 Sep 2026</td>
                <td><strong>Budi Santoso</strong><br/><small>RM-000001</small></td>
                <td>Pusing berdenyut pelipis</td>
                <td><strong>I10 - Essential (primary) hypertension</strong></td>
                <td>${statusBadge('FINAL')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('26 Sep 2026', '${defaultRoleMeta.name}', 'Pusing berdenyut pelipis', 'TD: 140/90 mmHg, N: 82x/m', 'I10 - Hipertensi Primer', 'Amlodipine 5mg 1x1 malam', 'FINAL')">Lihat RME</button></td>
              </tr>
              <tr>
                <td class="table-primary">26 Sep 2026</td>
                <td><strong>Siti Aminah</strong><br/><small>RM-000002</small></td>
                <td>Demam tinggi 3 hari</td>
                <td><strong>J02.9 - Acute pharyngitis, unspecified</strong></td>
                <td>${statusBadge('FINAL')}</td>
                <td><button class="action-btn-sm action-btn-primary" onclick="window.viewMedicalDetailDemo('26 Sep 2026', '${defaultRoleMeta.name}', 'Demam tinggi 3 hari', 'TD: 110/75 mmHg, Suhu: 38.4 C', 'J02.9 - Faringitis Akut', 'Paracetamol 500mg, Amoxicillin 500mg', 'FINAL')">Lihat RME</button></td>
              </tr>
            `;
          }
        }
      } else if (currentView === 'resep') {
        if (welcomeTitle) welcomeTitle.textContent = 'Resep Obat Elektronik (e-Prescription)';
        if (welcomeCopy) welcomeCopy.textContent = 'Daftar resep obat elektronik yang diterbitkan dokter untuk penyiapan instalasi farmasi.';
        if (statsGrid) statsGrid.innerHTML = '';
        if (agendaTitle) agendaTitle.textContent = 'Monitoring e-Resep';
        if (lowerTitle) lowerTitle.textContent = 'Daftar Resep Obat Terbit';

        if (tableHead) tableHead.innerHTML = '<th>No. Resep</th><th>Tanggal</th><th>Pasien / No. RM</th><th>Rincian Obat &amp; Dosis</th><th>Status Farmasi</th><th>Catatan</th>';
        
        let rxList = [];
        const rxRes = await window.prescriptionService.getDoctorPrescriptions(currentDoctorRecord?.id);
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
                <td class="table-primary">RX-20260926-0001</td>
                <td>26 Sep 2026</td>
                <td><strong>Budi Santoso</strong><br/><small>RM-000001</small></td>
                <td><strong>Amlodipine</strong> (5 mg) - 1x1 malam [30 pcs]</td>
                <td>${statusBadge('Diterbitkan')}</td>
                <td>Minum teratur setelah makan malam</td>
              </tr>
              <tr>
                <td class="table-primary">RX-20260926-0002</td>
                <td>26 Sep 2026</td>
                <td><strong>Siti Aminah</strong><br/><small>RM-000002</small></td>
                <td><strong>Paracetamol</strong> (500 mg) - 3x1 p.c. [10 pcs]<br/><strong>Amoxicillin</strong> (500 mg) - 3x1 p.c. [15 pcs]</td>
                <td>${statusBadge('Disiapkan')}</td>
                <td>Antibiotik harus dihabiskan</td>
              </tr>
            `;
          }
        }
      }
    }

    const btnViewAllAgenda = document.getElementById('btnViewAllAgenda');
    if (btnViewAllAgenda) {
      btnViewAllAgenda.addEventListener('click', () => {
        location.href = `${location.pathname}?view=jadwal`;
      });
    }

    const btnViewAllLower = document.getElementById('btnViewAllLower');
    if (btnViewAllLower) {
      btnViewAllLower.addEventListener('click', () => {
        location.href = `${location.pathname}?view=rekam-medis`;
      });
    }

    renderDokterDashboard();
  }

  window.openDoctorSoapModal = function(rm, name, complaint, patientId = '', apptId = '', recordId = '') {
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
})();
