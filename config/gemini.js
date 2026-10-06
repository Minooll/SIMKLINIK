// ====================================================================
// Konfigurasi Klien Google Gemini 2.0 Flash - SIMKLINIK Purworejo
// ====================================================================

const GEMINI_CONFIG = {
  apiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '',
  model: 'gemini-2.0-flash',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
};

/**
 * Memanggil Gemini 2.0 Flash REST API
 * @param {string} prompt Prompt pengguna
 * @param {string} systemInstruction Konteks sistem / persona
 * @returns {Promise<string>} Respons teks dari AI
 */
async function callGeminiApi(prompt, systemInstruction = '') {
  const apiKey = GEMINI_CONFIG.apiKey || (typeof window !== 'undefined' && window.GEMINI_API_KEY) || '';

  // Jika tanpa API key atau dalam mode testing / offline, berikan respons cerdas sesuai pelatihan Sasa
  if (!apiKey) {
    return generateLocalFallbackResponse(prompt, systemInstruction);
  }

  try {
    const url = `${GEMINI_CONFIG.endpoint}?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    };

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
      return generateLocalFallbackResponse(prompt, systemInstruction);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || generateLocalFallbackResponse(prompt, systemInstruction);
  } catch (err) {
    console.error('Gemini API network error:', err);
    return generateLocalFallbackResponse(prompt, systemInstruction);
  }
}

/**
 * Fallback lokal cerdas jika Gemini API tidak tersedia atau kuota habis.
 * Menjawab secara presisi sesuai domain klinis & sistem SIMKLINIK,
 * dan jika pertanyaan di luar topik, tetap menjawab singkat lalu menggiring kembali ke topik klinis/sistem.
 */
function generateLocalFallbackResponse(prompt, systemInstruction = '') {
  const lower = (prompt || '').toLowerCase().trim();

  // 1. SISTEM SIMKLINIK: Aturan 12 Jam / Pembatalan Janji
  if (lower.includes('batal') || lower.includes('12 jam') || lower.includes('cancel')) {
    return 'Di sistem SIMKLINIK Purworejo, pembatalan janji temu memiliki aturan ketat: Anda hanya dapat membatalkannya maksimal **12 jam** sebelum jadwal sesi pemeriksaan dimulai. Jika waktu tersisa kurang dari 12 jam, kuota pemeriksaan terkunci secara otomatis oleh sistem demi kepastian jadwal dokter faskes.';
  }

  // 2. SISTEM SIMKLINIK: Tiket Antrean Live / Countdown
  if (lower.includes('countdown') || lower.includes('antrean live') || lower.includes('tiket') || lower.includes('hitung mundur')) {
    return 'Fitur Antrean Live di SIMKLINIK Purworejo dilengkapi **Countdown Real-time** menuju sesi pemeriksaan dokter Anda. Anda dapat memantau sisa jam, menit, dan detik secara langsung di menu "Tiket Antrean Live" sehingga tidak perlu menunggu lama di ruang tunggu klinik.';
  }

  // 3. SISTEM SIMKLINIK: Cara Booking / Pendaftaran / Kuota
  if (lower.includes('cara booking') || lower.includes('cara daftar') || lower.includes('pesan kuota') || lower.includes('kuota')) {
    return 'Untuk memesan kuota di SIMKLINIK Purworejo: 1) Masuk ke portal pasien dan pastikan nomor KK serta NIK KTP Anda sudah lengkap, 2) Buka menu "Cari Klinik & Booking", 3) Pilih faskes dan dokter yang tersedia (dokter aktif dengan sisa kuota), 4) Pilih tanggal dan sesi jam periksa. Setelah konfirmasi, nomor tiket antrean langsung terbit!';
  }

  // 4. SISTEM SIMKLINIK: Rekam Medis (RME) / SOAP / NIK / KK
  if (lower.includes('nik') || lower.includes('kartu keluarga') || lower.includes('kk') || lower.includes('rme') || lower.includes('rekam medis') || lower.includes('soap')) {
    return 'Sesuai regulasi Permenkes No. 24/2022, data Kartu Keluarga (KK) dan NIK 16 digit wajib dilengkapi untuk rekam medis terpadu. Pasca pemeriksaan, dokter akan mengisi lembar RME SOAP yang resume digitalnya dapat Anda tinjau kapan saja di menu "Riwayat Rekam Medis (RME)".';
  }

  // 5. SISTEM SIMKLINIK: Kode Unik / Dokter Cuti / Pemilik Faskes
  if (lower.includes('kode unik') || lower.includes('referral') || lower.includes('cuti') || lower.includes('pemilik')) {
    return 'Pemilik Klinik di SIMKLINIK Purworejo dapat mengelola jadwal dokter, menandai status "Dokter Cuti" (agar tidak bisa dibooking sementara), serta membagikan kode referral unik kriptografis (format PWR-...) agar dokter dapat login secara aman ke faskes bersangkutan.';
  }

  // 6. KLINIS & KESEHATAN: Anak / Pediatri
  if (lower.includes('anak') || (lower.includes('demam') && lower.includes('anak')) || lower.includes('bayi') || lower.includes('balita')) {
    return 'Untuk penanganan anak yang mengalami keluhan sakit atau demam, pastikan kompres air hangat di dahi/lipatan ketiak, cukupi cairan tubuh, dan pantau suhu berkala. Untuk pemeriksaan lanjutan di wilayah Kutoarjo, dr. Hendra Wijaya, Sp.A di Klinik Pratama & Bersalin Kutoarjo Medika siap melayani Anda hari ini. [ACTION:BOOK, CLINIC_ID: "22222222-2222-2222-2222-222222222222", DOCTOR_ID: "cccccccc-cccc-cccc-cccc-cccccccccccc"]';
  }

  // 7. KLINIS & KESEHATAN: Gigi & Mulut
  if (lower.includes('gigi') || lower.includes('gusi') || lower.includes('cabut gigi') || lower.includes('karang')) {
    return 'Untuk keluhan sakit gigi atau gusi, Anda dapat berkumur dengan air garam hangat dan menghindari makanan/minuman yang terlalu panas, dingin, atau manis. Untuk tindakan medis gigi di Purworejo Kota, drg. Siti Rahayu di Klinik Pratama Sehat Mandiri Purworejo siap melayani dengan kuota tersedia hari ini. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]';
  }

  // 8. KLINIS & KESEHATAN: Demam, Flu, Batuk, Sakit Kepala
  if (lower.includes('demam') || lower.includes('pusing') || lower.includes('sakit kepala') || lower.includes('batuk') || lower.includes('flu') || lower.includes('pilek')) {
    return 'Untuk keluhan demam, batuk, atau sakit kepala: istirahatlah yang cukup, perbanyak minum air putih hangat, dan konsumsi pereda nyeri/demam seperti Paracetamol bila diperlukan. Jika gejala berlanjut lebih dari 2-3 hari, Anda dapat memeriksakan diri ke dr. Budi Santoso di Klinik Pratama Sehat Mandiri Purworejo. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]';
  }

  // 9. KLINIS & KESEHATAN: Lambung, Maag, Mual, Perut
  if (lower.includes('lambung') || lower.includes('maag') || lower.includes('mual') || lower.includes('perut') || lower.includes('gerd')) {
    return 'Untuk keluhan nyeri lambung atau maag: hindari makanan pedas, asam, bersantan, dan minuman berkafein. Makanlah dalam porsi kecil namun sering. Jika rasa perih atau mual menetap, disarankan berkonsultasi dengan dr. Ratna Dewi di Klinik Pratama Keluarga Banyuurip. [ACTION:BOOK, CLINIC_ID: "33333333-3333-3333-3333-333333333333", DOCTOR_ID: "dddddddd-dddd-dddd-dddd-dddddddddddd"]';
  }

  // 10. KLINIS & KESEHATAN: Hipertensi, Tensi, Jantung, Lansia
  if (lower.includes('tensi') || lower.includes('hipertensi') || lower.includes('darah tinggi') || lower.includes('kolesterol')) {
    return 'Pemeriksaan tensi darah dan pencegahan hipertensi sangat penting dilakukan secara rutin. Kurangi konsumsi garam dan kelola stres dengan baik. Anda dapat melakukan cek berkala di Klinik Pratama Sehat Mandiri Purworejo bersama dr. Budi Santoso hari ini. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]';
  }

  // 11. KLINIS & KESEHATAN: Rekomendasi Klinik per Kecamatan Purworejo
  if (lower.includes('kutoarjo')) {
    return 'Di wilayah Kutoarjo, faskes mitra kami adalah Klinik Pratama & Bersalin Kutoarjo Medika (Jl. Pangeran Diponegoro No. 88, Kutoarjo) dengan layanan dokter spesialis anak dr. Hendra Wijaya, Sp.A dan fasilitas bersalin. [ACTION:BOOK, CLINIC_ID: "22222222-2222-2222-2222-222222222222", DOCTOR_ID: "cccccccc-cccc-cccc-cccc-cccccccccccc"]';
  }
  if (lower.includes('banyuurip')) {
    return 'Di wilayah Banyuurip, faskes mitra kami adalah Klinik Pratama Keluarga Banyuurip (Jl. Banyuurip Raya KM 3) yang melayani poli umum bersama dr. Ratna Dewi. [ACTION:BOOK, CLINIC_ID: "33333333-3333-3333-3333-333333333333", DOCTOR_ID: "dddddddd-dddd-dddd-dddd-dddddddddddd"]';
  }
  if (lower.includes('purworejo kota') || lower.includes('kota')) {
    return 'Di area Purworejo Kota, Anda dapat mengunjungi Klinik Pratama Sehat Mandiri Purworejo (Jl. Jenderal Sudirman No. 45) dengan layanan dokter umum dr. Budi Santoso dan dokter gigi drg. Siti Rahayu. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]';
  }

  // 12. SAPAAN UMUM / IDENTITAS
  if (lower.includes('halo') || lower.includes('hai') || lower.includes('siapa kamu') || lower.includes('selamat pagi') || lower.includes('selamat siang') || lower.includes('selamat malam')) {
    return 'Halo! Saya Sasa, singkatan dari "Sahabat Asisten Sehat Anda", Asisten Medis Virtual resmi SIMKLINIK Purworejo. Saya siap membantu Anda berkonsultasi mengenai keluhan kesehatan, info jadwal dokter, kuota klinik di Purworejo, maupun panduan penggunaan sistem SIMKLINIK. Ada yang bisa saya bantu untuk kesehatan Anda hari ini?';
  }

  // 13. PERTANYAAN DI LUAR TOPIK (Out-of-Scope)
  // Menjawab singkat pertanyaan lalu secara luwes menggiring kembali ke topik kesehatan/sistem SIMKlinik
  let shortAnswer = 'Menarik sekali pertanyaannya!';
  if (lower.includes('cuaca')) {
    shortAnswer = 'Mengenai cuaca, saat ini kondisi iklim di wilayah Purworejo dan sekitarnya cukup dinamis.';
  } else if (lower.includes('resep') || lower.includes('masak') || lower.includes('makan')) {
    shortAnswer = 'Untuk resep masakan, mengonsumsi makanan bergizi seimbang dengan porsi sayur dan protein yang cukup sangat baik untuk metabolisme tubuh.';
  } else if (lower.includes('coding') || lower.includes('program') || lower.includes('komputer') || lower.includes('it')) {
    shortAnswer = 'Terkait teknologi dan komputasi, sistem digital seperti platform SIMKLINIK ini juga dibangun dengan arsitektur web modern agar responsif dan aman.';
  } else if (lower.includes('presiden') || lower.includes('politik')) {
    shortAnswer = 'Terkait wawasan umum tersebut, hal tersebut tentu menjadi bagian dari informasi publik yang luas.';
  } else if (lower.includes('lagu') || lower.includes('musik') || lower.includes('film')) {
    shortAnswer = 'Musik dan hiburan memang sangat baik untuk meredakan stres dan menjaga kesehatan mental.';
  } else {
    shortAnswer = 'Terkait hal tersebut, itu merupakan topik umum yang menarik.';
  }

  return `${shortAnswer} Namun sebagai Sasa "Sahabat Asisten Sehat Anda", fokus utama saya adalah mendampingi kesehatan warga Purworejo dan memandu fitur sistem SIMKLINIK. Apakah saat ini ada keluhan kesehatan, informasi jadwal dokter, atau panduan antrean klinik di Purworejo yang sedang Anda butuhkan?`;
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
