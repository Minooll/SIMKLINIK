// ====================================================================
// Konfigurasi Klien Google Gemini 2.0 Flash - SIMKLINIK Purworejo
// ====================================================================

const GEMINI_CONFIG = {
  apiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '',
  model: 'gemini-2.0-flash',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
};

/**
 * Memanggil Gemini 2.0 Flash REST API dengan dukungan Multi-turn Conversation History
 * @param {string} prompt Prompt pengguna
 * @param {string} systemInstruction Konteks sistem / persona
 * @param {Array} history Riwayat obrolan terdahulu [{ role: 'user'|'model', text: '...' }]
 * @returns {Promise<string>} Respons teks dari AI
 */
async function callGeminiApi(prompt, systemInstruction = '', history = []) {
  const apiKey = GEMINI_CONFIG.apiKey || (typeof window !== 'undefined' && (window.GEMINI_API_KEY || window.localStorage?.getItem('simklinik_gemini_api_key') || window.localStorage?.getItem('gemini_api_key'))) || '';

  // Jika tanpa API key atau dalam mode testing / offline, berikan respons cerdas sesuai pelatihan Sasa
  if (!apiKey) {
    return generateLocalFallbackResponse(prompt, systemInstruction, history);
  }

  try {
    const url = `${GEMINI_CONFIG.endpoint}?key=${apiKey}`;

    // Susun multi-turn contents jika ada history percakapan sebelumnya
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (!item || !item.text) continue;
        contents.push({
          role: (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user',
          parts: [{ text: item.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const payload = { contents };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn('Gemini API request failed with status:', response.status);
      return generateLocalFallbackResponse(prompt, systemInstruction, history);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || generateLocalFallbackResponse(prompt, systemInstruction, history);
  } catch (err) {
    console.error('Gemini API network error:', err);
    return generateLocalFallbackResponse(prompt, systemInstruction, history);
  }
}

/**
 * Fallback lokal cerdas dan kontekstual jika Gemini API tidak tersedia atau kuota habis.
 * Menjawab secara logis, kontekstual terhadap riwayat obrolan, empatik, dan bebas template kaku.
 * @param {string} prompt Pesan pengguna saat ini
 * @param {string} systemInstruction Instruksi persona/konteks
 * @param {Array} history Riwayat obrolan terdahulu [{ role: 'user'|'model', text: '...' }]
 * @returns {string} Respons bot yang nyambung dan logis
 */
function generateLocalFallbackResponse(prompt, systemInstruction = '', history = []) {
  const lower = (prompt || '').toLowerCase().trim();

  // Ekstrak konteks dari riwayat obrolan (history)
  const historyText = Array.isArray(history)
    ? history.map(h => (h.text || '')).join(' ').toLowerCase()
    : '';

  const hasContextKutoarjo = historyText.includes('kutoarjo') || historyText.includes('hendra');
  const hasContextSehatMandiri = historyText.includes('sehat mandiri') || historyText.includes('budi') || historyText.includes('siti');
  const hasContextBanyuurip = historyText.includes('banyuurip') || historyText.includes('ratna');
  const hasContextPediatri = historyText.includes('anak') || historyText.includes('bayi') || historyText.includes('balita');
  const hasContextGigi = historyText.includes('gigi') || historyText.includes('gusi');
  const hasContextLambung = historyText.includes('lambung') || historyText.includes('maag') || historyText.includes('perut') || historyText.includes('gerd');

  // =========================================================================
  // 1. PERTANYAAN FOLLOW-UP BERDASARKAN KONTEKS RIWAYAT (MULTI-TURN AWARENESS)
  // =========================================================================

  // A. Jadwal / Praktik / Jam Buka dokter atau klinik
  const isAskingScheduleOrOpen = lower.includes('buka') || lower.includes('jadwal') || lower.includes('jam') || lower.includes('praktik') || lower.includes('praktek') || lower.includes('hari ini');
  if (isAskingScheduleOrOpen) {
    if (hasContextKutoarjo || hasContextPediatri) {
      return 'Ya, dr. Hendra Wijaya, Sp.A di Klinik Pratama & Bersalin Kutoarjo Medika berpraktik hari ini (pukul 08.00 - 15.00 WIB) dan sisa kuota konsultasi anak masih tersedia. Anda bisa langsung memesan tiket antrean di portal pasien agar terdaftar di urutan pemeriksaan.';
    }
    if (hasContextGigi) {
      return 'drg. Siti Rahayu di Klinik Pratama Sehat Mandiri Purworejo berpraktik hari ini mulai pukul 09.00 WIB dengan kuota yang masih tersedia. Silakan amankan antrean Anda sebelum sesi penuh.';
    }
    if (hasContextBanyuurip || hasContextLambung) {
      return 'dr. Ratna Dewi di Klinik Pratama Keluarga Banyuurip siap melayani pasien hari ini dengan antrean yang terpantau lancar dan sisa kuota yang memadai.';
    }
    if (hasContextSehatMandiri) {
      return 'dr. Budi Santoso di Klinik Pratama Sehat Mandiri Purworejo melayani pemeriksaan hari ini. Jadwal sesi tersedia dari pagi hingga sore hari.';
    }
    // Jika tidak ada konteks spesifik, berikan info umum jam operasional faskes Purworejo
    return 'Klinik mitra SIMKLINIK Purworejo umumnya buka setiap hari kerja pukul 08.00 - 20.00 WIB. Dokter jaga yang aktif beserta sisa kuota hari ini dapat langsung dipantau secara langsung di menu "Cari Klinik & Booking".';
  }

  // B. Pertanyaan Metode Pembayaran / BPJS / Asuransi / Biaya
  if (lower.includes('bpjs') || lower.includes('umum') || lower.includes('bayar') || lower.includes('biaya') || lower.includes('tarif') || lower.includes('asuransi')) {
    return 'Fasilitas kesehatan mitra SIMKLINIK Purworejo melayani pasien umum maupun pasien BPJS Kesehatan (Faskes Tingkat Pertama). Pastikan Anda membawa KTP dan kartu BPJS saat registrasi fisik di klinik untuk verifikasi status kepesertaan aktif Anda.';
  }

  // =========================================================================
  // 2. SISTEM SIMKLINIK PURWOREJO (ATURAN & FITUR KHUSUS)
  // =========================================================================

  // Aturan 12 Jam / Pembatalan Janji
  if (lower.includes('batal') || lower.includes('12 jam') || lower.includes('cancel')) {
    return 'Di sistem SIMKLINIK Purworejo, pembatalan janji temu memiliki aturan ketat: Anda hanya dapat membatalkannya maksimal **12 jam** sebelum jadwal sesi pemeriksaan dimulai. Jika waktu tersisa kurang dari 12 jam, kuota pemeriksaan terkunci secara otomatis oleh sistem demi kepastian jadwal dokter faskes.';
  }

  // Tiket Antrean Live / Countdown
  if (lower.includes('countdown') || lower.includes('antrean live') || lower.includes('tiket') || lower.includes('hitung mundur')) {
    return 'Fitur Antrean Live di SIMKLINIK Purworejo dilengkapi **Countdown Real-time** menuju sesi pemeriksaan dokter Anda. Anda dapat memantau sisa jam, menit, dan detik secara langsung di menu "Tiket Antrean Live" sehingga tidak perlu menunggu lama di ruang tunggu klinik.';
  }

  // Cara Booking / Pendaftaran / Kuota
  if (lower.includes('cara booking') || lower.includes('cara daftar') || lower.includes('pesan kuota') || (lower.includes('kuota') && !isAskingScheduleOrOpen)) {
    return 'Untuk memesan kuota di SIMKLINIK Purworejo: 1) Masuk ke portal pasien dan pastikan nomor KK serta NIK KTP Anda sudah lengkap, 2) Buka menu "Cari Klinik & Booking", 3) Pilih faskes dan dokter yang tersedia (dokter aktif dengan sisa kuota), 4) Pilih tanggal dan sesi jam periksa. Setelah konfirmasi, nomor tiket antrean langsung terbit!';
  }

  // Rekam Medis (RME) / SOAP / NIK / KK
  if (lower.includes('nik') || lower.includes('kartu keluarga') || lower.includes('kk') || lower.includes('rme') || lower.includes('rekam medis') || lower.includes('soap')) {
    return 'Sesuai regulasi Permenkes No. 24/2022, data Kartu Keluarga (KK) dan NIK 16 digit wajib dilengkapi untuk rekam medis terpadu. Pasca pemeriksaan, dokter akan mengisi lembar RME SOAP yang resume digitalnya dapat Anda tinjau kapan saja di menu "Riwayat Rekam Medis (RME)".';
  }

  // Kode Unik / Dokter Cuti / Pemilik Faskes
  if (lower.includes('kode unik') || lower.includes('referral') || lower.includes('cuti') || lower.includes('pemilik')) {
    return 'Pemilik Klinik di SIMKLINIK Purworejo dapat mengelola jadwal dokter, menandai status "Dokter Cuti" (agar tidak bisa dibooking sementara), serta membagikan kode referral unik kriptografis (format PWR-...) agar dokter dapat login secara aman ke faskes bersangkutan.';
  }

  // =========================================================================
  // 3. LOGICAL REASONING / EXPLANATION ("KENAPA", "MENGAPA", "PENYEBAB")
  // =========================================================================

  // Asam lambung / dada panas / perih / heartburn / GERD
  if (lower.includes('refluks') || lower.includes('esofagus') || lower.includes('heartburn') || ((lower.includes('kenapa') || lower.includes('mengapa') || lower.includes('sebab') || lower.includes('alasannya')) && (lower.includes('lambung') || lower.includes('dada') || lower.includes('panas') || lower.includes('perih')))) {
    return 'Sensasi panas dan perih di dada (dikenal sebagai heartburn) umumnya dipicu oleh refluks asam lambung yang naik ke esofagus (saluran kerongkongan). Berbeda dengan lambung yang memiliki lapisan mukosa tebal penahan asam, dinding esofagus sangat sensitif terhadap cairan asam sehingga kontak tersebut menimbulkan iritasi dan rasa terbakar. Penanganan awalnya: hindari berbaring minimal 2 jam setelah makan, konsumsi makanan dalam porsi kecil namun sering, dan hindari pemicu seperti kopi, cabai, atau santan pekat.';
  }

  // Pusing / sakit kepala
  if ((lower.includes('kenapa') || lower.includes('mengapa') || lower.includes('sebab')) && (lower.includes('pusing') || lower.includes('sakit kepala') || lower.includes('migrain'))) {
    return 'Pusing atau sakit kepala bisa dipicu oleh beberapa faktor logis: ketegangan otot leher (tension headache) akibat kelelahan atau posisi duduk yang salah, dehidrasi, kurang tidur, maupun fluktuasi tekanan darah. Jika pusing disertai rasa berputar (vertigo), hal itu berkaitan dengan gangguan organ keseimbangan di telinga dalam. Pertolongan awal: istirahat di ruangan tenang, cukupi minum air putih, dan redakan ketegangan mata.';
  }

  // Demam
  if ((lower.includes('kenapa') || lower.includes('mengapa') || lower.includes('sebab')) && lower.includes('demam')) {
    return 'Demam sebenarnya merupakan respons fisiologis alami dari sistem kekebalan tubuh yang sedang melawan infeksi bakteri atau virus. Bagian otak bernama hipotalamus sengaja menaikkan "set point" suhu tubuh karena mikroorganisme patogen sulit berkembang biak di suhu yang lebih tinggi. Kompres hangat dan hidrasi yang cukup sangat penting untuk membantu tubuh melewati fase ini.';
  }

  // =========================================================================
  // 4. KLINIS & KESEHATAN KHUSUS (EDUKASI + SARAN FASKES & DOKTER PURWOREJO)
  // =========================================================================

  // Anak / Pediatri
  if (lower.includes('anak') || (lower.includes('demam') && (lower.includes('anak') || lower.includes('bayi') || lower.includes('balita')))) {
    return 'Untuk penanganan anak yang mengalami keluhan sakit atau demam, pastikan kompres air hangat di dahi/lipatan ketiak, cukupi cairan tubuh, dan pantau suhu berkala. Untuk pemeriksaan lanjutan di wilayah Kutoarjo, dr. Hendra Wijaya, Sp.A di Klinik Pratama & Bersalin Kutoarjo Medika siap melayani Anda hari ini. [ACTION:BOOK, CLINIC_ID: "22222222-2222-2222-2222-222222222222", DOCTOR_ID: "cccccccc-cccc-cccc-cccc-cccccccccccc"]';
  }

  // Gigi & Mulut
  if (lower.includes('gigi') || lower.includes('gusi') || lower.includes('cabut gigi') || lower.includes('karang')) {
    return 'Untuk keluhan sakit gigi atau gusi, Anda dapat berkumur dengan air garam hangat dan menghindari makanan/minuman yang terlalu panas, dingin, atau manis. Untuk tindakan medis gigi di Purworejo Kota, drg. Siti Rahayu di Klinik Pratama Sehat Mandiri Purworejo siap melayani dengan kuota tersedia hari ini. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]';
  }

  // Lambung / Maag / Mual / Gerd
  if (lower.includes('lambung') || lower.includes('maag') || lower.includes('mual') || lower.includes('perut') || lower.includes('gerd')) {
    return 'Untuk keluhan nyeri lambung atau maag: hindari makanan pedas, asam, bersantan, dan minuman berkafein. Makanlah dalam porsi kecil namun sering. Jika rasa perih atau mual menetap, disarankan berkonsultasi dengan dr. Ratna Dewi di Klinik Pratama Keluarga Banyuurip. [ACTION:BOOK, CLINIC_ID: "33333333-3333-3333-3333-333333333333", DOCTOR_ID: "dddddddd-dddd-dddd-dddd-dddddddddddd"]';
  }

  // Demam, Flu, Batuk, Sakit Kepala
  if (lower.includes('demam') || lower.includes('pusing') || lower.includes('sakit kepala') || lower.includes('batuk') || lower.includes('flu') || lower.includes('pilek')) {
    return 'Untuk keluhan demam, batuk, atau sakit kepala: istirahatlah yang cukup, perbanyak minum air putih hangat, dan konsumsi pereda nyeri/demam seperti Paracetamol bila diperlukan. Jika gejala berlanjut lebih dari 2-3 hari, Anda dapat memeriksakan diri ke dr. Budi Santoso di Klinik Pratama Sehat Mandiri Purworejo. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]';
  }

  // Hipertensi, Tensi, Kolesterol
  if (lower.includes('tensi') || lower.includes('hipertensi') || lower.includes('darah tinggi') || lower.includes('kolesterol')) {
    return 'Pemeriksaan tensi darah dan pencegahan hipertensi sangat penting dilakukan secara rutin. Kurangi konsumsi garam dan kelola stres dengan baik. Anda dapat melakukan cek berkala di Klinik Pratama Sehat Mandiri Purworejo bersama dr. Budi Santoso hari ini. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]';
  }

  // Rekomendasi Klinik per Wilayah
  if (lower.includes('kutoarjo')) {
    return 'Di wilayah Kutoarjo, faskes mitra kami adalah Klinik Pratama & Bersalin Kutoarjo Medika (Jl. Pangeran Diponegoro No. 88, Kutoarjo) dengan layanan dokter spesialis anak dr. Hendra Wijaya, Sp.A dan fasilitas bersalin. [ACTION:BOOK, CLINIC_ID: "22222222-2222-2222-2222-222222222222", DOCTOR_ID: "cccccccc-cccc-cccc-cccc-cccccccccccc"]';
  }
  if (lower.includes('banyuurip')) {
    return 'Di wilayah Banyuurip, faskes mitra kami adalah Klinik Pratama Keluarga Banyuurip (Jl. Banyuurip Raya KM 3) yang melayani poli umum bersama dr. Ratna Dewi. [ACTION:BOOK, CLINIC_ID: "33333333-3333-3333-3333-333333333333", DOCTOR_ID: "dddddddd-dddd-dddd-dddd-dddddddddddd"]';
  }
  if (lower.includes('purworejo kota') || lower.includes('kota')) {
    return 'Di area Purworejo Kota, Anda dapat mengunjungi Klinik Pratama Sehat Mandiri Purworejo (Jl. Jenderal Sudirman No. 45) dengan layanan dokter umum dr. Budi Santoso dan dokter gigi drg. Siti Rahayu. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]';
  }

  // =========================================================================
  // 5. SAPAAN RAMAH & DIALOG ALAMI (CONVERSATIONAL)
  // =========================================================================
  if (lower.includes('halo') || lower.includes('hai') || lower.includes('selamat pagi') || lower.includes('selamat siang') || lower.includes('selamat malam') || lower.includes('assalamu') || lower.includes('sore') || lower.includes('kabar')) {
    let sapaanWaktu = 'Halo';
    if (lower.includes('siang')) sapaanWaktu = 'Selamat siang';
    else if (lower.includes('pagi')) sapaanWaktu = 'Selamat pagi';
    else if (lower.includes('malam')) sapaanWaktu = 'Selamat malam';
    else if (lower.includes('sore')) sapaanWaktu = 'Selamat sore';

    return `${sapaanWaktu}! Senang bisa menyapa Anda. Saya Sasa, asisten kesehatan virtual SIMKLINIK Purworejo. Bagaimana kabar Anda hari ini? Ada keluhan kesehatan yang sedang dirasakan atau informasi faskes di Purworejo yang bisa saya bantu?`;
  }

  if (lower.includes('siapa kamu') || lower.includes('nama kamu')) {
    return 'Saya Sasa (Sahabat Asisten Sehat Anda), asisten medis virtual resmi SIMKLINIK Purworejo. Saya siap diajak berdiskusi tentang keluhan kesehatan ringan, info dokter jaga, ketersediaan kuota, hingga panduan pendaftaran faskes di Purworejo.';
  }

  // =========================================================================
  // 6. PERTANYAAN DI LUAR TOPIK (LUWES MENJAWAB LALU MENGHUBUNGKAN SECARA NATURAL)
  // =========================================================================
  if (lower.includes('resep') || lower.includes('masak') || lower.includes('makanan') || lower.includes('rendang')) {
    return 'Untuk resep dan masakan, menjaga pola makan bergizi seimbang dengan kombinasi protein dan serat yang cukup sangat baik bagi stamina tubuh. Di SIMKLINIK Purworejo, kami juga mendampingi kesehatan keluarga Anda. Apakah ada keluhan kesehatan atau info faskes yang ingin Anda konsultasikan?';
  }
  if (lower.includes('coding') || lower.includes('program') || lower.includes('python') || lower.includes('komputer') || lower.includes('it')) {
    return 'Terkait teknologi dan komputasi, sistem digital seperti platform SIMKLINIK Purworejo ini dibangun dengan arsitektur web modern agar aman dan responsif bagi masyarakat. Apakah ada seputar penggunaan sistem SIMKLINIK atau jadwal klinik di Purworejo yang ingin Anda ketahui?';
  }
  if (lower.includes('cuaca')) {
    return 'Mengenai cuaca, kondisi iklim di wilayah Purworejo dan sekitarnya belakangan ini cukup fluktuatif. Pada kondisi cuaca yang sering berganti, penting untuk menjaga imun dan asupan air putih agar tidak mudah terkena flu atau demam.';
  }

  // Respons umum alami (bukan template kaku robotik)
  return 'Pertanyaan yang menarik. Terkait hal tersebut, saya senang bisa berdiskusi santai dengan Anda. Sebagai asisten kesehatan di SIMKLINIK Purworejo, saya juga siap membantu jika Anda membutuhkan saran pertolongan pertama, info dokter spesialis, atau panduan antrean klinik. Ada yang ingin Anda ceritakan lebih lanjut?';
}

if (typeof window !== 'undefined') {
  window.GEMINI_CONFIG = GEMINI_CONFIG;
  window.callGeminiApi = callGeminiApi;
  window.generateLocalFallbackResponse = generateLocalFallbackResponse;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEMINI_CONFIG,
    callGeminiApi,
    generateLocalFallbackResponse
  };
}

