(() => {
  'use strict';

  const roleKey = new URLSearchParams(window.location.search).get('role') || 'pasien';
  const role = ['dokter', 'pasien', 'petugas'].includes(roleKey) ? roleKey : 'pasien';
  if (window.location.pathname.endsWith('/dashboard.html') || window.location.pathname.endsWith('dashboard.html')) {
    window.location.replace(role + '.html');
    return;
  }
  const data = {
    dokter: {
      label: 'Dokter', name: 'dr. Ayu Rahma', initials: 'AR', greeting: 'Selamat pagi, dr. Ayu', copy: 'Berikut ringkasan aktivitas klinik Anda hari ini.', action: 'Buat resep', agenda: 'Jadwal konsultasi', insight: 'Aktivitas terbaru', lower: 'Pasien yang perlu ditindaklanjuti',
      stats: [['Pasien hari ini', '18', '+12% dari kemarin', '♧', 'mint'], ['Jadwal selesai', '06', '2 jadwal berikutnya', '✓', 'blue'], ['Resep aktif', '24', '3 perlu ditinjau', '✦', 'gold'], ['Rata-rata layanan', '18m', '4m lebih cepat', '◷', 'coral']],
      schedule: [['08:30', 'Budi Santoso', 'Kontrol tekanan darah', 'Selesai', ''], ['09:15', 'Siti Aminah', 'Konsultasi umum', 'Sedang berjalan', 'wait'], ['10:00', 'Rizky Pratama', 'Evaluasi hasil lab', 'Berikutnya', 'wait'], ['11:30', 'Maria Lestari', 'Konsultasi umum', 'Terjadwal', 'wait']],
      activities: [['✓', 'Resep diterbitkan', 'Untuk Siti Aminah · 2 menit lalu'], ['↗', 'Hasil laboratorium masuk', 'Budi Santoso · 18 menit lalu'], ['◎', 'Catatan medis diperbarui', 'Rizky Pratama · 42 menit lalu']],
      headers: ['Pasien', 'Keluhan utama', 'Kunjungan terakhir', 'Status'], rows: [['Budi Santoso', 'Hipertensi', 'Hari ini, 08:30', 'Perlu kontrol'], ['Rizky Pratama', 'Demam berdarah', 'Kemarin, 15:10', 'Hasil lab masuk'], ['Maria Lestari', 'Migrain', '18 Sep 2026', 'Terjadwal']]
    },
    petugas: {
      label: 'Petugas', name: 'Nadia Prameswari', initials: 'NP', greeting: 'Selamat pagi, Nadia', copy: 'Pantau alur layanan dan antrean klinik hari ini.', action: 'Tambah pasien', agenda: 'Antrean hari ini', insight: 'Aktivitas loket', lower: 'Pendaftaran terbaru',
      stats: [['Antrean aktif', '12', '4 pasien menunggu', '♧', 'mint'], ['Terdaftar hari ini', '36', '+8 pasien dari kemarin', '＋', 'blue'], ['Jadwal dokter', '08', '2 dokter tersedia', '◷', 'gold'], ['Pembayaran', 'Rp 4,2jt', '92% sudah lunas', '□', 'coral']],
      schedule: [['08:00', 'Budi Santoso', 'Poli Umum · dr. Ayu', 'Dipanggil', ''], ['08:20', 'Siti Aminah', 'Poli Umum · dr. Ayu', 'Menunggu', 'wait'], ['08:45', 'Rizky Pratama', 'Laboratorium', 'Menunggu', 'wait'], ['09:00', 'Maria Lestari', 'Poli Umum · dr. Dimas', 'Menunggu', 'wait']],
      activities: [['＋', 'Pasien baru terdaftar', 'Andi Wijaya · 3 menit lalu'], ['□', 'Pembayaran diterima', 'Budi Santoso · 12 menit lalu'], ['↗', 'Rujukan diperbarui', 'Siti Aminah · 25 menit lalu']],
      headers: ['Pasien', 'Layanan', 'Waktu daftar', 'Status'], rows: [['Budi Santoso', 'Poli Umum', '08:02', 'Dipanggil'], ['Andi Wijaya', 'Poli Gigi', '08:14', 'Menunggu'], ['Siti Aminah', 'Laboratorium', '08:18', 'Menunggu']]
    },
    pasien: {
      label: 'Pasien', name: 'Aulia Rahma', initials: 'AR', greeting: 'Selamat pagi, Aulia', copy: 'Kelola jadwal dan pantau perjalanan kesehatan Anda.', action: 'Buat janji', agenda: 'Jadwal saya', insight: 'Ringkasan kesehatan', lower: 'Riwayat kunjungan',
      stats: [['Janji mendatang', '02', 'Kunjungan terdekat 24 Sep', '◷', 'mint'], ['Resep aktif', '03', '1 resep berakhir minggu ini', '✦', 'blue'], ['Hasil pemeriksaan', '05', '2 hasil belum dibaca', '□', 'gold'], ['Poin kesehatan', '840', '+80 bulan ini', '♡', 'coral']],
      schedule: [['24 Sep', 'dr. Ayu Rahma', 'Konsultasi umum', 'Terjadwal', 'wait'], ['02 Okt', 'Laboratorium', 'Pemeriksaan darah', 'Terjadwal', 'wait'], ['—', '—', 'Belum ada jadwal lain', '', '']],
      activities: [['◉', 'Hasil pemeriksaan tersedia', 'Tes darah · 20 Sep 2026'], ['✦', 'Resep diperbarui', 'Vitamin dan suplemen · 18 Sep 2026'], ['□', 'Pembayaran berhasil', 'Kunjungan · 18 Sep 2026']],
      headers: ['Tanggal', 'Dokter / layanan', 'Keluhan', 'Status'], rows: [['18 Sep 2026', 'dr. Dimas · Poli Umum', 'Sakit kepala', 'Selesai'], ['07 Agu 2026', 'dr. Ayu · Poli Umum', 'Kontrol rutin', 'Selesai'], ['12 Jul 2026', 'Laboratorium', 'Pemeriksaan darah', 'Selesai']]
    }
  }[role];

  const nav = role === 'dokter' ? [['▦','Dashboard'],['♧','Pasien saya'],['◷','Jadwal praktik'],['□','Rekam medis'],['✦','Resep']] : role === 'petugas' ? [['▦','Dashboard'],['♧','Data pasien'],['◷','Antrean layanan'],['□','Jadwal dokter'],['▤','Pembayaran']] : [['▦','Dashboard'],['◷','Janji saya'],['□','Rekam medis'],['✦','Resep saya'],['♡','Profil kesehatan']];
  document.getElementById('mainNav').innerHTML = nav.map(([icon, label], index) => `<a class="nav-item${index === 0 ? ' active' : ''}" href="#"><span>${icon}</span><span>${label}</span></a>`).join('');
  document.getElementById('headerName').textContent = data.name;
  document.getElementById('headerRole').textContent = data.label;
  document.getElementById('headerAvatar').textContent = data.initials;
  document.getElementById('welcomeTitle').textContent = data.greeting;
  document.getElementById('welcomeCopy').textContent = data.copy;
  document.getElementById('primaryActionText').textContent = data.action;
  document.getElementById('agendaTitle').textContent = data.agenda;
  document.getElementById('insightTitle').textContent = data.insight;
  document.getElementById('lowerTitle').textContent = data.lower;
  document.getElementById('statsGrid').innerHTML = data.stats.map(([label, value, note, icon, color]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon stat-icon--${color}">${icon}</span></div><strong class="stat-value">${value}</strong><small class="stat-note ${note.startsWith('+') ? 'up' : ''}">${note}</small></article>`).join('');
  document.getElementById('scheduleList').innerHTML = data.schedule.map(([time, person, detail, status, statusClass]) => `<div class="schedule-item"><time class="schedule-time">${time}</time><div><strong>${person}</strong><small>${detail}</small></div>${status ? `<span class="status ${statusClass}">${status}</span>` : ''}</div>`).join('');
  document.getElementById('insightContent').innerHTML = data.activities.map(([icon, title, detail]) => `<div class="activity"><span class="activity-icon">${icon}</span><div><strong>${title}</strong><small>${detail}</small></div></div>`).join('');
  document.getElementById('tableHead').innerHTML = data.headers.map(header => `<th>${header}</th>`).join('');
  document.getElementById('tableBody').innerHTML = data.rows.map((row, index) => `<tr>${row.map((cell, cellIndex) => cellIndex === 0 ? `<td><div class="table-person"><span class="table-avatar">${cell.split(' ').map(word => word[0]).slice(0,2).join('')}</span>${cell}</div></td>` : `<td>${cell}</td>`).join('')}</tr>`).join('');
  document.getElementById('dateLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();

  async function enforceSupabaseSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
      window.location.href = 'login.html';
      return;
    }
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();
    const actualRole = profile?.role === 'Dokter' ? 'dokter' : profile?.role === 'Pasien' ? 'pasien' : 'petugas';
    if (actualRole !== role) window.location.href = 'dashboard.html?role=' + actualRole;
  }
  enforceSupabaseSession();

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', event => {
    event.stopPropagation();
    sidebar.classList.toggle('is-open');
  });
  document.addEventListener('click', event => {
    if (sidebar.classList.contains('is-open') && !sidebar.contains(event.target) && event.target !== menuToggle) {
      sidebar.classList.remove('is-open');
    }
  });
  document.getElementById('logoutButton').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
})();
