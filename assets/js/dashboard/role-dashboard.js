(() => {
  'use strict';
  const role = document.body.dataset.role;
  const data = {
    dokter: {
      label: 'Dokter', name: 'dr. Ayu Rahma', initials: 'AR', greeting: 'Selamat pagi, dr. Ayu', copy: 'Kelola pasien, jadwal praktik, rekam medis, dan resep.',
      nav: [['dashboard','▦','Dashboard'],['pasien','♧','Pasien saya'],['jadwal','◷','Jadwal praktik'],['rekam-medis','□','Rekam medis'],['resep','✦','Resep']],
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
      nav: [['dashboard','▦','Dashboard'],['pasien','♧','Data pasien'],['antrean','◷','Antrean layanan'],['dokter','□','Jadwal dokter'],['pembayaran','▤','Pembayaran']],
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
      nav: [['dashboard','▦','Dashboard'],['janji','◷','Janji saya'],['rekam-medis','□','Rekam medis'],['resep','✦','Resep saya'],['profil','♡','Profil kesehatan']],
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
  nav.innerHTML = data.nav.map(([view, icon, label]) => `<a class="nav-item${currentView === view ? ' active' : ''}" href="${location.pathname}?view=${view}"><span>${icon}</span><span>${label}</span></a>`).join('');
  document.getElementById('headerName').textContent = data.name;
  document.getElementById('headerRole').textContent = data.label;
  document.getElementById('headerAvatar').textContent = data.initials;
  document.getElementById('dateLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();
  const content = document.getElementById('pageContent');
  const table = (headers, rows) => `<div class="table-wrap"><table><thead><tr>${headers.map(item => `<th>${item}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, index) => `<td${index === 0 ? ' class="table-primary"' : ''}>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const form = (label, action) => `<form class="feature-form" onsubmit="event.preventDefault();this.querySelector('.form-notice').textContent='${action} berhasil disimpan.'"><label>${label}<input required placeholder="Masukkan ${label.toLowerCase()}" /></label><button class="primary-button" type="submit">Simpan</button><p class="form-notice"></p></form>`;
  if (currentView === 'dashboard') {
    document.getElementById('welcomeTitle').textContent = data.greeting;
    document.getElementById('welcomeCopy').textContent = data.copy;
    document.getElementById('primaryActionText').textContent = role === 'pasien' ? 'Buat janji' : role === 'dokter' ? 'Buat resep' : 'Tambah pasien';
    document.getElementById('statsGrid').innerHTML = data.stats.map(([label, value, note]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">✦</span></div><strong class="stat-value">${value}</strong><small class="stat-note">${note}</small></article>`).join('');
    document.getElementById('agendaTitle').textContent = data.dashboard.title;
    document.getElementById('scheduleList').innerHTML = data.dashboard.rows.map(([time, person, detail, status]) => `<div class="schedule-item"><time class="schedule-time">${time}</time><div><strong>${person}</strong><small>${detail}</small></div><span class="status">${status}</span></div>`).join('');
    document.getElementById('insightTitle').textContent = 'Aktivitas terbaru';
    document.getElementById('insightContent').innerHTML = ['Data berhasil tersinkronisasi','Tidak ada tugas mendesak','Pembaruan terakhir beberapa menit lalu'].map(text => `<div class="activity"><span class="activity-icon">✓</span><div><strong>${text}</strong><small>Informasi terbaru dari sistem SIMKLINIK</small></div></div>`).join('');
    document.getElementById('lowerTitle').textContent = role === 'dokter' ? 'Pasien yang perlu ditindaklanjuti' : role === 'petugas' ? 'Pendaftaran terbaru' : 'Riwayat kunjungan';
    document.getElementById('tableHead').innerHTML = '<th>Nama</th><th>Keterangan</th><th>Waktu</th><th>Status</th>';
    document.getElementById('tableBody').innerHTML = data.dashboard.rows.slice(0, 3).map(row => `<tr><td class="table-primary">${row[1]}</td><td>${row[2]}</td><td>${row[0]}</td><td>${row[3]}</td></tr>`).join('');
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
    document.getElementById('tableBody').innerHTML = '<tr><td class="table-primary">Aktif</td><td>Data halaman siap digunakan.</td></tr>';
  }
  document.getElementById('primaryAction').addEventListener('click', () => { const target = role === 'pasien' ? 'janji' : role === 'dokter' ? 'resep' : 'pasien'; location.href = `${location.pathname}?view=${target}`; });
  document.querySelectorAll('.text-button').forEach(button => button.addEventListener('click', () => { location.href = `${location.pathname}?view=${role === 'dokter' ? 'pasien' : role === 'petugas' ? 'antrean' : 'janji'}`; }));
  const sidebar = document.getElementById('sidebar');
  document.getElementById('menuToggle').addEventListener('click', event => { event.stopPropagation(); sidebar.classList.toggle('is-open'); });
  document.addEventListener('click', event => { if (sidebar.classList.contains('is-open') && !sidebar.contains(event.target) && event.target.id !== 'menuToggle') sidebar.classList.remove('is-open'); });
  document.getElementById('logoutButton').addEventListener('click', async () => { await supabaseClient.auth.signOut(); location.href = 'login.html'; });
  async function guard() {
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) { location.href = 'login.html'; return; }
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', data.session.user.id).single();
    const actualRole = profile?.role === 'Dokter' ? 'dokter' : profile?.role === 'Pasien' ? 'pasien' : 'petugas';
    if (actualRole !== role) location.href = actualRole + '.html';
  }
  guard();
  document.querySelector('.icon-button').addEventListener('click', () => window.alert('Tidak ada notifikasi baru.'));
})();
