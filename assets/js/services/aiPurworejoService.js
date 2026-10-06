// ====================================================================
// Service AI Copilot Gemini 2.0 Flash - Sasa (Sahabat Asisten Sehat Anda)
// ====================================================================

/**
 * Menyusun Dynamic System Prompt dengan injeksi konteks live faskes Purworejo
 */
function buildPurworejoSystemPrompt(context = {}) {
  const clinics = context.clinics || [
    { name: 'Klinik Pratama Sehat Mandiri Purworejo', district: 'Purworejo Kota' },
    { name: 'Klinik Pratama & Bersalin Kutoarjo Medika', district: 'Kutoarjo' },
    { name: 'Klinik Pratama Keluarga Banyuurip', district: 'Banyuurip' }
  ];

  const doctors = context.doctors || [
    { name: 'dr. Budi Santoso', clinic_name: 'Klinik Pratama Sehat Mandiri Purworejo', specialty: 'Dokter Umum', remaining_quota: 5, active_queue_count: 2 },
    { name: 'drg. Siti Rahayu', clinic_name: 'Klinik Pratama Sehat Mandiri Purworejo', specialty: 'Dokter Gigi', remaining_quota: 8, active_queue_count: 1 },
    { name: 'dr. Hendra Wijaya, Sp.A', clinic_name: 'Klinik Pratama & Bersalin Kutoarjo Medika', specialty: 'Spesialis Anak', remaining_quota: 10, active_queue_count: 4 }
  ];

  const clinicListText = clinics.map(c => `- ${c.name} (Kecamatan ${c.district})`).join('\n');
  const doctorListText = doctors.map(d => `- ${d.name} di ${d.clinic_name} (${d.specialty || 'Umum'}): sisa kuota: ${d.remaining_quota}, antrean aktif: ${d.active_queue_count}`).join('\n');

  return `Anda adalah Sasa, singkatan dari "Sahabat Asisten Sehat Anda", Asisten Medis Virtual resmi untuk platform SIMKLINIK Purworejo, Kabupaten Purworejo, Jawa Tengah.
Tugas utama Anda:
1. Memberikan saran triage awal yang ramah dan menenangkan bagi warga Purworejo yang mengalami keluhan sakit.
2. Merekomendasikan fasilitas klinik dan dokter yang tepat di wilayah Kabupaten Purworejo (Purworejo Kota, Kutoarjo, Banyuurip, dsb).
3. Menginformasikan ketersediaan kuota dokter terkini dan tingkat kepadatan antrean.
4. Jika pasien membutuhkan konsultasi langsung atau pemeriksaan faskes, sertakan token tindakan booking di akhir pesan:
[ACTION:BOOK, CLINIC_ID: "<id_klinik>", DOCTOR_ID: "<id_dokter>"]

Daftar Klinik Aktif di Purworejo:
${clinicListText}

Jadwal Dokter & Kuota Realtime:
${doctorListText}

Gunakan Bahasa Indonesia yang santun, empatik, dan informatif. Ingatkan selalu bahwa saran ini adalah panduan awal dan bukan pengganti diagnosa medis tatap muka langsung oleh dokter.`;
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
    // Fallback response for Node / offline testing
    const lower = userMessage.toLowerCase();
    if (lower.includes('kutoarjo') || lower.includes('demam') || lower.includes('anak')) {
      rawResponse = 'Halo! Saya Sasa "Sahabat Asisten Sehat Anda". Untuk keluhan demam pada anak di area Kutoarjo, dr. Hendra Wijaya, Sp.A di Klinik Kutoarjo Medika siap melayani Anda dengan sisa kuota 10 pasien. [ACTION:BOOK, CLINIC_ID: "22222222-2222-2222-2222-222222222222", DOCTOR_ID: "cccccccc-cccc-cccc-cccc-cccccccccccc"]';
    } else {
      rawResponse = 'Halo! Saya Sasa "Sahabat Asisten Sehat Anda" dari SIMKLINIK Purworejo. Ada keluhan kesehatan apa yang sedang Anda rasakan? Kami siap membantu merekomendasikan klinik terbaik.';
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
