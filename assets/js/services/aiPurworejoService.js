// ====================================================================
// Service AI Copilot Gemini 2.0 Flash - Sasa (Sahabat Asisten Sehat Anda)
// ====================================================================

/**
 * Menyusun Dynamic System Prompt dengan pelatihan terfokus pada:
 * 1. Menjawab tepat sesuai pertanyaan pengguna
 * 2. Membatasi lingkup pada topik klinis/kesehatan dan sistem SIMKLINIK Purworejo
 * 3. Menjawab pertanyaan di luar topik secara singkat lalu menggiring kembali ke topik klinis / sistem
 */
function buildPurworejoSystemPrompt(context = {}) {
  const clinics = context.clinics || [
    { name: 'Klinik Pratama Sehat Mandiri Purworejo', district: 'Purworejo Kota', address: 'Jl. Jenderal Sudirman No. 45' },
    { name: 'Klinik Pratama & Bersalin Kutoarjo Medika', district: 'Kutoarjo', address: 'Jl. Pangeran Diponegoro No. 88' },
    { name: 'Klinik Pratama Keluarga Banyuurip', district: 'Banyuurip', address: 'Jl. Banyuurip Raya KM 3' }
  ];

  const doctors = context.doctors || [
    { name: 'dr. Budi Santoso', clinic_name: 'Klinik Pratama Sehat Mandiri Purworejo', specialty: 'Dokter Umum', remaining_quota: 5, active_queue_count: 2 },
    { name: 'drg. Siti Rahayu', clinic_name: 'Klinik Pratama Sehat Mandiri Purworejo', specialty: 'Dokter Gigi', remaining_quota: 8, active_queue_count: 1 },
    { name: 'dr. Hendra Wijaya, Sp.A', clinic_name: 'Klinik Pratama & Bersalin Kutoarjo Medika', specialty: 'Spesialis Anak', remaining_quota: 10, active_queue_count: 4 },
    { name: 'dr. Ratna Dewi', clinic_name: 'Klinik Pratama Keluarga Banyuurip', specialty: 'Dokter Umum', remaining_quota: 12, active_queue_count: 3 }
  ];

  const clinicListText = clinics.map(c => `- ${c.name} (Kecamatan ${c.district}, ${c.address || ''})`).join('\n');
  const doctorListText = doctors.map(d => `- ${d.name} di ${d.clinic_name} (${d.specialty || 'Dokter Umum'}): sisa kuota: ${d.remaining_quota}, antrean aktif: ${d.active_queue_count}`).join('\n');

  return `Anda adalah Sasa, singkatan dari "Sahabat Asisten Sehat Anda", Asisten Medis Virtual resmi untuk platform SIMKLINIK Purworejo, Kabupaten Purworejo, Jawa Tengah.

PERAN & TUGAS UTAMA ANDA:
1. Menjawab pertanyaan pengguna secara TEPAT, SPESIFIK, dan SESUAI dengan apa yang ditanyakan. Jangan memberikan jawaban template yang kaku atau tidak nyambung dengan pertanyaan pengguna.
2. BATASAN RUANG LINGKUP (KLINIS & SISTEM):
   A. TOPIK KLINIS & KESEHATAN:
      - Memberikan edukasi kesehatan, saran triase awal, tips penanganan pertama mandiri yang aman dan menenangkan.
      - Merekomendasikan fasilitas klinik dan dokter yang tepat di Kabupaten Purworejo (Purworejo Kota, Kutoarjo, Banyuurip) sesuai spesialisasi keluhan (anak, gigi, umum).
      - Jika pasien memerlukan konsultasi atau pemeriksaan dokter langsung di klinik, sertakan token tindakan booking di akhir pesan:
        [ACTION:BOOK, CLINIC_ID: "<id_klinik>", DOCTOR_ID: "<id_dokter>"]
      - Selalu ingatkan bahwa saran klinis ini bersifat panduan awal dan bukan pengganti diagnosa medis tatap muka langsung oleh dokter.
   B. TOPIK SISTEM SIMKLINIK PURWOREJO:
      - Menjelaskan cara penggunaan platform SIMKLINIK:
        * Cara reservasi kuota dokter faskes.
        * Fitur tiket antrean live dengan estimasi countdown panggilan giliran.
        * Aturan ketat pembatalan janji temu: hanya dapat dibatalkan maksimal 12 jam sebelum jadwal; sisa waktu kurang dari 12 jam terkunci otomatis oleh sistem faskes.
        * Profil rekam medis elektronik (RME): kewajiban melengkapi nomor Kartu Keluarga (KK) dan NIK KTP 16 digit sesuai standar Permenkes No. 24/2022.
        * Alur rekam medis SOAP sekuensial bagi dokter dan kode unik faskes bagi pemilik klinik.
3. ATURAN PERTANYAAN DI LUAR TOPIK (Out-of-Scope):
   - Jika pengguna bertanya tentang hal di luar topik kesehatan atau sistem SIMKlinik (misalnya cuaca, coding/pemrograman, resep masakan, obrolan santai, politik, sains umum, dll.):
     * TETAP JAWAB pertanyaan tersebut secara singkat, ramah, dan sopan (1-2 kalimat).
     * SETELAH ITU, SECARA LUWES GANTIKAN ATAU GIRING PERCAKAPAN KEMBALI ke topik kesehatan, keluhan medis, atau fitur sistem SIMKLINIK Purworejo.
     * Contoh penutup: "Ngomong-ngomong, sebagai Sahabat Asisten Sehat Anda di SIMKLINIK Purworejo, apakah ada keluhan kesehatan atau informasi faskes dan jadwal dokter di Purworejo yang bisa saya bantu hari ini?"

DAFTAR KLINIK AKTIF DI PURWOREJO:
${clinicListText}

JADWAL DOKTER & KUOTA REALTIME:
${doctorListText}

GAYA BAHASA:
Santun, empatik, informatif, dan solutif. Gunakan Bahasa Indonesia yang ramah khas warga Purworejo.`;
}

/**
 * Mendeteksi token aksi booking pada balasan AI dan mengekstrak parameternya
 */
function parseAiActionTokens(message) {
  if (!message || typeof message !== 'string') {
    return { hasAction: false, cleanText: '', clinicId: null, doctorId: null };
  }

  const regex = /\[ACTION:BOOK,\s*CLINIC_ID:\s*"([^"]+)",\s*DOCTOR_ID:\s*"([^"]+)"\]/i;
  const match = message.match(regex);

  if (match) {
    const cleanText = message.replace(regex, '').trim();
    return {
      hasAction: true,
      cleanText,
      clinicId: match[1],
      doctorId: match[2]
    };
  }

  return {
    hasAction: false,
    cleanText: message.trim(),
    clinicId: null,
    doctorId: null
  };
}

/**
 * Mengirim pesan konsultasi ke Sasa AI Copilot
 */
async function askSasaAi(userMessage, context = {}) {
  const promptSystem = buildPurworejoSystemPrompt(context);
  let rawResponse = '';

  if (typeof window !== 'undefined' && typeof window.callGeminiApi === 'function') {
    rawResponse = await window.callGeminiApi(userMessage, promptSystem);
  } else {
    // Gunakan fungsi fallback cerdas jika running di Node atau tanpa API key
    if (typeof generateLocalFallbackResponse === 'function') {
      rawResponse = generateLocalFallbackResponse(userMessage, promptSystem);
    } else {
      const { generateLocalFallbackResponse: fallbackFn } = require('../../../config/gemini.js');
      rawResponse = fallbackFn(userMessage, promptSystem);
    }
  }

  return parseAiActionTokens(rawResponse);
}

// Alias for backwards compatibility
const askNaylaAi = askSasaAi;

if (typeof window !== 'undefined') {
  window.buildPurworejoSystemPrompt = buildPurworejoSystemPrompt;
  window.parseAiActionTokens = parseAiActionTokens;
  window.askSasaAi = askSasaAi;
  window.askNaylaAi = askNaylaAi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildPurworejoSystemPrompt,
    parseAiActionTokens,
    askSasaAi,
    askNaylaAi
  };
}
