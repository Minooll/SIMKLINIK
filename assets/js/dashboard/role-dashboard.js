(() => {
  'use strict';
  const role = document.body.dataset.role;

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

  const statusBadge = (text) => {
    if (!text || text === '-' || text.length > 25) return text || '';
    const norm = text.toLowerCase();
    let cls = 'status-default';
    if (norm.includes('dipanggil') || norm.includes('berjalan')) cls = 'status-active';
    else if (norm.includes('menunggu') || norm.includes('perlu') || norm.includes('draft') || norm.includes('berikutnya')) cls = 'status-waiting';
    else if (norm.includes('selesai') || norm.includes('lengkap') || norm.includes('lunas') || norm.includes('tersimpan')) cls = 'status-done';
    else if (norm.includes('terjadwal') || norm.includes('aktif')) cls = 'status-info';
    return `<span class="status-badge ${cls}">${text}</span>`;
  };

  const data = {
    dokter: {
      label: 'Dokter', name: 'dr. Ayu Rahma', initials: 'AR', greeting: 'Selamat pagi, dr. Ayu', copy: 'Kelola pasien, jadwal praktik, rekam medis, dan resep.',
      nav: [['dashboard','Dashboard'],['pasien','Pasien saya'],['jadwal','Jadwal praktik'],['rekam-medis','Rekam medis'],['resep','Resep']],
      stats: [['Pasien hari ini','18','+12% dari kemarin'],['Jadwal selesai','06','2 jadwal berikutnya'],['Resep aktif','24','3 perlu ditinjau'],['Rata-rata layanan','18m','4m lebih cepat']],
      dashboard: { title: 'Jadwal konsultasi', rows: [['08:30','Budi Santoso','Kontrol tekanan darah','Selesai'],['09:15','Siti Aminah','Konsultasi umum','Sedang berjalan'],['10:00','Rizky Pratama','Evaluasi hasil lab','Berikutnya'],['11:30','Maria Lestari','Konsultasi umum','Terjadwal']] },
      pages: {
        pasien: ['Pasien saya','Daftar pasien yang berada dalam tanggung jawab Anda.', ['Nama pasien','Keluhan','Kunjungan terakhir','Status'], [['Budi Santoso','Hipertensi','Hari ini, 08:30','Perlu kontrol'],['Rizky Pratama','Demam berdarah','Kemarin, 15:10','Hasil lab masuk'],['Maria Lestari','Migrain','18 Sep 2026','Terjadwal']]],
        jadwal: ['Jadwal praktik','Atur jadwal konsultasi dan ketersediaan praktik.', ['Tanggal','Jam','Poli','Status'], [['22 Sep 2026','08:30 - 12:00','Poli Umum','Aktif'],['23 Sep 2026','08:30 - 12:00','Poli Umum','Aktif'],['24 Sep 2026','Libur','-','Tidak tersedia']]],
        'rekam-medis': ['Rekam medis','Tinjau catatan klinis pasien.', ['Pasien','Pembaruan terakhir','Dokter','Status'], [['Budi Santoso','22 Sep 2026, 08:30','dr. Ayu Rahma','Lengkap'],['Siti Aminah','22 Sep 2026, 09:15','dr. Ayu Rahma','Draft'],['Rizky Pratama','21 Sep 2026, 15:10','dr. Ayu Rahma','Lengkap']]],
        resep: ['Resep','Kelola resep yang diterbitkan.', ['Nomor resep','Pasien','Tanggal','Status'], [['RX-24091','Siti Aminah','22 Sep 2026','Aktif'],['RX-24088','Budi Santoso','21 Sep 2026','Selesai'],['RX-24075','Maria Lestari','18 Sep 2026','Aktif']]]
      }
    },
    petugas: {
      label: 'Petugas', name: 'Nadia Prameswari', initials: 'NP', greeting: 'Selamat pagi, Nadia', copy: 'Pantau antrean, data pasien, jadwal dokter, dan pembayaran.',
      nav: [['dashboard','Dashboard'],['pasien','Data pasien'],['antrean','Antrean layanan'],['dokter','Jadwal dokter'],['pembayaran','Pembayaran']],
      stats: [['Antrean aktif','12','4 pasien menunggu'],['Terdaftar hari ini','36','+8 pasien dari kemarin'],['Jadwal dokter','08','2 dokter tersedia'],['Pembayaran','Rp 4,2jt','92% sudah lunas']],
      dashboard: { title: 'Antrean hari ini', rows: [['08:00','Budi Santoso','Poli Umum · dr. Ayu','Dipanggil'],['08:20','Siti Aminah','Poli Umum · dr. Ayu','Menunggu'],['08:45','Rizky Pratama','Laboratorium','Menunggu'],['09:00','Maria Lestari','Poli Umum · dr. Dimas','Menunggu']] },
      pages: {
        pasien: ['Data pasien','Kelola pendaftaran dan data pasien klinik.', ['Nama pasien','Layanan','Waktu daftar','Status'], [['Budi Santoso','Poli Umum','08:02','Dipanggil'],['Andi Wijaya','Poli Gigi','08:14','Menunggu'],['Siti Aminah','Laboratorium','08:18','Menunggu']]],
        antrean: ['Antrean layanan','Panggil pasien dan perbarui status layanan.', ['Nomor','Pasien','Layanan','Status'], [['A-021','Budi Santoso','Poli Umum','Dipanggil'],['A-022','Siti Aminah','Poli Umum','Menunggu'],['A-023','Rizky Pratama','Laboratorium','Menunggu']]],
        dokter: ['Jadwal dokter','Lihat jadwal dokter yang bertugas.', ['Dokter','Poli','Jam praktik','Status'], [['dr. Ayu Rahma','Poli Umum','08:30 - 12:00','Aktif'],['dr. Dimas Putra','Poli Umum','09:00 - 13:00','Aktif'],['dr. Rani Sari','Poli Gigi','10:00 - 14:00','Aktif']]],
        pembayaran: ['Pembayaran','Pantau transaksi dan status pembayaran.', ['Pasien','Layanan','Total','Status'], [['Budi Santoso','Konsultasi','Rp 150.000','Lunas'],['Siti Aminah','Laboratorium','Rp 275.000','Menunggu'],['Maria Lestari','Konsultasi','Rp 150.000','Lunas']]]
      }
    },
    pasien: {
      label: 'Pasien', name: 'Aulia Rahma', initials: 'AR', greeting: 'Selamat pagi, Aulia', copy: 'Kelola janji temu, resep, rekam medis, dan profil kesehatan.',
      nav: [['dashboard','Dashboard'],['janji','Janji saya'],['rekam-medis','Rekam medis'],['resep','Resep saya'],['profil','Profil kesehatan']],
      stats: [['Janji mendatang','02','Kunjungan terdekat 24 Sep'],['Resep aktif','03','1 resep berakhir minggu ini'],['Hasil pemeriksaan','05','2 hasil belum dibaca'],['Poin kesehatan','840','+80 bulan ini']],
      dashboard: { title: 'Jadwal saya', rows: [['24 Sep','dr. Ayu Rahma','Konsultasi umum','Terjadwal'],['02 Okt','Laboratorium','Pemeriksaan darah','Terjadwal'],['—','—','Belum ada jadwal lain','']] },
      pages: {
        janji: ['Janji saya','Atur dan pantau jadwal kunjungan Anda.', ['Tanggal','Dokter / layanan','Keperluan','Status'], [['24 Sep 2026','dr. Ayu · Poli Umum','Konsultasi umum','Terjadwal'],['02 Okt 2026','Laboratorium','Pemeriksaan darah','Terjadwal']]],
        'rekam-medis': ['Rekam medis','Lihat riwayat pemeriksaan kesehatan Anda.', ['Tanggal','Dokter / layanan','Keluhan','Status'], [['18 Sep 2026','dr. Dimas · Poli Umum','Sakit kepala','Selesai'],['07 Agu 2026','dr. Ayu · Poli Umum','Kontrol rutin','Selesai']]],
        resep: ['Resep saya','Lihat resep dan obat yang sedang aktif.', ['Tanggal','Dokter','Obat','Status'], [['18 Sep 2026','dr. Ayu Rahma','Vitamin dan suplemen','Aktif'],['07 Agu 2026','dr. Dimas Putra','Paracetamol','Selesai']]],
        profil: ['Profil kesehatan','Perbarui informasi kesehatan Anda.', ['Data','Nilai','Keterangan'], [['Golongan darah','O','Tersimpan'],['Alergi obat','Tidak ada','Tersimpan'],['Kontak darurat','Budi Rahma','Tersimpan']]]
      }
    }
  }[role];

  if (!data) return;

  const currentView = new URLSearchParams(location.search).get('view') || 'dashboard';
  const nav = document.getElementById('mainNav');
  nav.innerHTML = data.nav.map(([view, label]) => {
    const iconSvg = ICONS[view] || ICONS.dashboard;
    return `<a class="nav-item${currentView === view ? ' active' : ''}" href="${location.pathname}?view=${view}"><span>${iconSvg}</span><span>${label}</span></a>`;
  }).join('');

  document.getElementById('headerName').textContent = data.name;
  document.getElementById('headerRole').textContent = data.label;
  document.getElementById('headerAvatar').textContent = data.initials;
  document.getElementById('dateLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();

  const table = (headers, rows) => `<div class="table-wrap"><table><thead><tr>${headers.map(item => `<th>${item}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, index) => `<td${index === 0 ? ' class="table-primary"' : ''}>${index === row.length - 1 ? statusBadge(cell) : cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const form = (label, action) => `<form class="feature-form" onsubmit="event.preventDefault();this.querySelector('.form-notice').textContent='${action} berhasil disimpan.'"><label>${label}<input required placeholder="Masukkan ${label.toLowerCase()}" /></label><button class="primary-button" type="submit">Simpan</button><p class="form-notice"></p></form>`;

  if (currentView === 'dashboard') {
    document.getElementById('welcomeTitle').textContent = data.greeting;
    document.getElementById('welcomeCopy').textContent = data.copy;
    document.getElementById('primaryActionText').textContent = role === 'pasien' ? 'Buat janji' : role === 'dokter' ? 'Buat resep' : 'Tambah pasien';
    document.getElementById('statsGrid').innerHTML = data.stats.map(([label, value, note]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${ICONS.sparkle}</span></div><strong class="stat-value">${value}</strong><small class="stat-note">${note}</small></article>`).join('');
    document.getElementById('agendaTitle').textContent = data.dashboard.title;
    document.getElementById('scheduleList').innerHTML = data.dashboard.rows.map(([time, person, detail, status]) => `<div class="schedule-item"><time class="schedule-time">${time}</time><div><strong>${person}</strong><small>${detail}</small></div>${statusBadge(status)}</div>`).join('');
    document.getElementById('insightTitle').textContent = 'Aktivitas terbaru';
    document.getElementById('insightContent').innerHTML = ['Data operasional tersinkronisasi','Koneksi database PostgreSQL terverifikasi','Pembaruan sistem terkini berjalan lancar'].map(text => `<div class="activity"><span class="activity-icon">${ICONS.check}</span><div><strong>${text}</strong><small>Informasi real-time SIMKLINIK</small></div></div>`).join('');
    document.getElementById('lowerTitle').textContent = role === 'dokter' ? 'Pasien yang perlu ditindaklanjuti' : role === 'petugas' ? 'Pendaftaran terbaru' : 'Riwayat kunjungan';
    document.getElementById('tableHead').innerHTML = '<th>Nama</th><th>Keterangan</th><th>Waktu</th><th>Status</th>';
    document.getElementById('tableBody').innerHTML = data.dashboard.rows.slice(0, 3).map(row => `<tr><td class="table-primary">${row[1]}</td><td>${row[2]}</td><td>${row[0]}</td><td>${statusBadge(row[3])}</td></tr>`).join('');
  } else {
    const page = data.pages[currentView] || data.pages[Object.keys(data.pages)[0]];
    document.getElementById('welcomeTitle').textContent = page[0];
    document.getElementById('welcomeCopy').textContent = page[1];
    document.getElementById('primaryActionText').textContent = role === 'pasien' ? 'Buat janji' : 'Tambah data';
    document.getElementById('statsGrid').innerHTML = '';
    document.getElementById('agendaTitle').textContent = page[0];
    document.getElementById('scheduleList').innerHTML = `<div class="feature-copy">${page[1]}</div>${table(page[2], page[3])}`;
    document.getElementById('insightTitle').textContent = 'Aksi cepat';
    document.getElementById('insightContent').innerHTML = form(role === 'pasien' ? 'Tanggal kunjungan' : 'Nama atau nomor data', 'Data');
    document.getElementById('lowerTitle').textContent = 'Informasi terbaru';
    document.getElementById('tableHead').innerHTML = '<th>Status sistem</th><th>Detail</th>';
    document.getElementById('tableBody').innerHTML = `<tr><td class="table-primary">${statusBadge('Aktif')}</td><td>Modul sistem siap digunakan.</td></tr>`;
  }

  document.getElementById('primaryAction').addEventListener('click', () => {
    const target = role === 'pasien' ? 'janji' : role === 'dokter' ? 'resep' : 'pasien';
    location.href = `${location.pathname}?view=${target}`;
  });

  document.querySelectorAll('.text-button').forEach(button => button.addEventListener('click', () => {
    location.href = `${location.pathname}?view=${role === 'dokter' ? 'pasien' : role === 'petugas' ? 'antrean' : 'janji'}`;
  }));

  const sidebar = document.getElementById('sidebar');
  document.getElementById('menuToggle').addEventListener('click', event => {
    event.stopPropagation();
    sidebar.classList.toggle('is-open');
  });

  document.addEventListener('click', event => {
    if (sidebar.classList.contains('is-open') && !sidebar.contains(event.target) && event.target.id !== 'menuToggle') {
      sidebar.classList.remove('is-open');
    }
  });

  document.getElementById('logoutButton').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    location.href = 'login.html';
  });

  async function guard() {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
      location.href = 'login.html';
      return;
    }
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', sessionData.session.user.id).single();
    const actualRole = profile?.role === 'Dokter' ? 'dokter' : profile?.role === 'Pasien' ? 'pasien' : 'petugas';
    if (actualRole !== role) {
      location.href = actualRole + '.html';
    }
  }
  guard();

  document.querySelector('.icon-button').addEventListener('click', () => {
    window.alert('Tidak ada notifikasi baru.');
  });
})();
