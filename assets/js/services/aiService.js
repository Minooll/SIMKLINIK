/**
 * SIMKLINIK - Unified Clinical & Operational AI Service
 * Powered by Google Gemini 2.0 Flash.
 * Compliant with Permenkes No. 24/2022 & UU PDP No. 27/2022.
 */
(() => {
  'use strict';

  let client = typeof window !== 'undefined' && window.geminiClient ? window.geminiClient : null;

  const setClient = (c) => { client = c; };

  const getClient = () => {
    if (!client && typeof window !== 'undefined') {
      client = window.geminiClient;
    }
    if (!client) {
      throw new Error('Gemini client belum terinisialisasi.');
    }
    return client;
  };

  /**
   * Helper: Parse JSON from raw Gemini response safely even if wrapped in markdown blocks
   */
  const extractJson = (text) => {
    if (!text) return null;
    const trimmed = text.trim();
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const cleaned = jsonMatch ? jsonMatch[1].trim() : trimmed;
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  };

  /**
   * 1. Smart Triage & Poli Assistant
   */
  const triagePatient = async (complaint, history = [], services = []) => {
    const serviceList = services.length > 0 
      ? services.map(s => `- ${s.name || s}`).join('\n') 
      : '- Poli Umum\n- Poli Gigi & Mulut\n- Poli Anak (Pediatri)\n- Poli Penyakit Dalam';

    const systemPrompt = `Anda adalah "Sasa" (Sistem Asisten Skrining & Anamnesis), asisten cerdas medis dari SIMKLINIK.
Aturan Identitas & Branding:
- Perkenalkan diri HANYA sebagai "Sasa, Asisten Cerdas SIMKLINIK".
- DILARANG KERAS menambahkan nama klinik lain seperti "Sehat Pratama" atau nama klinik fiktif apa pun. Fasilitas ini murni bernama "SIMKLINIK".

Tugas Anda:
1. Menganalisis keluhan fisik pasien secara empatik, ringkas, dan jelas.
2. Tentukan TINGKAT KEGAWATAN:
   - "🟢 Ringan" (perawatan mandiri awal, konsultasi opsional)
   - "🟡 Sedang" (perlu periksa dokter di klinik)
   - "🔴 Darurat UGD" (red flags: sesak napas berat, nyeri dada menjalar, muntah darah, kehilangan kesadaran, cedera kepala berat).
3. Jika kondisi Darurat UGD: Wajib cantumkan tag [EMERGENCY_ALERT], instruksikan segera ke IGD/119, dan JANGAN rekomendasikan booking poliklinik biasa.
4. Jika kondisi Ringan/Sedang: Rekomendasikan nama poli yang cocok HANYA dari katalog berikut:
${serviceList}
Sertakan tag aksi: [BOOK_POLI: "Nama Poli yang Dipilih"].
5. Berikan panduan perawatan mandiri secara ringkas dan praktis.
6. Selalu sertakan disclaimer medis singkat: "Informasi ini panduan awal edukatif, bukan pengganti diagnosis resmi dokter."
Gunakan Bahasa Indonesia yang ramah, santun, lugas, dan mudah dipahami pasien awam.`;

    const responseText = await getClient().callGemini(complaint, systemPrompt, { temperature: 0.2 });
    const isEmergency = responseText.includes('[EMERGENCY_ALERT]') || /darurat ugd|kegawatdaruratan/i.test(responseText);
    const matchPoli = responseText.match(/\[BOOK_POLI:\s*["']?([^"'\]]+)["']?\]/);
    const suggestedPoli = matchPoli ? matchPoli[1].trim() : null;

    let triageLevel = '🟢 Ringan';
    if (isEmergency) triageLevel = '🔴 Darurat UGD';
    else if (/sedang|perlu konsultasi|perlu periksa/i.test(responseText)) triageLevel = '🟡 Sedang';

    return {
      rawText: responseText,
      triageLevel,
      isEmergency,
      suggestedPoli
    };
  };

  /**
   * 2. AI Medication Explainer
   */
  const explainMedications = async (prescriptionItems, diagnosis = '') => {
    const medList = Array.isArray(prescriptionItems)
      ? prescriptionItems.map(m => `- ${m.name || m.medicine_name}: ${m.dosage || ''} (${m.frequency || m.rules || ''}), jumlah: ${m.quantity || ''}`).join('\n')
      : String(prescriptionItems);

    const systemPrompt = `Anda adalah Apoteker Virtual Edukatif SIMKLINIK.
Tugas: Menerjemahkan resep obat dan instruksi medis menjadi penjelasan ramah awam.
Format respons terstruktur:
1. 📋 **Fungsi Obat**: Jelaskan kegunaan tiap obat dengan bahasa sederhana (hindari istilah latin).
2. ⏰ **Aturan & Jadwal Konsumsi**: Jelaskan arti singkatan (misal 3x1 a.c. = diminum 3 kali sehari, sebelum makan).
3. ⚠️ **Instruksi Penting**: Wajib habis atau bila perlu saja, efek samping ringan yang wajar.
4. 🥗 **Pantangan & Tips Gaya Hidup**: Pantangan makanan/minuman dan pola istirahat sesuai diagnosa (${diagnosis || 'Umum'}).
Gunakan gaya bicara menenangkan, sopan, dan mudah dimengerti.`;

    const prompt = `Resep Pasien:\n${medList}\nDiagnosa: ${diagnosis || '-'}`;
    const responseText = await getClient().callGemini(prompt, systemPrompt, { temperature: 0.3 });
    return responseText;
  };

  /**
   * 3. AI Ambient SOAP Generator (Permenkes No. 24/2022)
   */
  const generateSoapFromNotes = async (rawNotes, vitals = {}) => {
    const vitalsStr = vitals ? `Tekanan Darah: ${vitals.systolic || '-'}/${vitals.diastolic || '-'} mmHg, Nadi: ${vitals.pulse || '-'} bpm, Suhu: ${vitals.temp || '-'} C, RR: ${vitals.rr || '-'} x/m` : '-';

    const systemPrompt = `Anda adalah Dokter Spesialis Rekam Medis Elektronik berstandar Permenkes No. 24 Tahun 2022.
Ubah catatan mentah pemeriksaan fisik/keluhan dokter menjadi format SOAP resmi:
Kembalikan HANYA format JSON valid berikut tanpa pembuka/penutup tambahan:
{
  "subjective": "Keluhan utama, riwayat perjalanan penyakit, keluhan penyerta terstruktur...",
  "objective": "Pemeriksaan fisik sistematis yang relevan...",
  "assessment": "Diagnosis kerja klinis utama...",
  "icd10": "Kode ICD-10 WHO standar yang paling tepat (contoh: J02.9, K29.7, I10)...",
  "plan": "Rencana penatalaksanaan terapi medikamentosa, edukasi pasien, dan kontrol ulang..."
}`;

    const prompt = `Catatan Mentah Dokter:\n${rawNotes}\nTanda Vital Pasien:\n${vitalsStr}`;
    const rawResponse = await getClient().callGemini(prompt, systemPrompt, { temperature: 0.1 });
    const parsed = extractJson(rawResponse);
    if (!parsed) {
      throw new Error('Gagal memformat catatan ke JSON SOAP Permenkes.');
    }
    return parsed;
  };

  /**
   * 4. Safety Checker: Alergi & Interaksi Obat
   */
  const checkPrescriptionSafety = async (patientAllergies, candidateMedications) => {
    const medList = Array.isArray(candidateMedications)
      ? candidateMedications.map(m => typeof m === 'object' ? `${m.name || m.medicine_name} ${m.dosage || ''}` : String(m)).join(', ')
      : String(candidateMedications);

    const systemPrompt = `Anda adalah Sistem Deteksi Keselamatan Farmasi Klinis (Clinical Pharmacovigilance).
Tugas Anda:
1. Memeriksa riwayat alergi pasien terhadap daftar obat yang hendak diresepkan.
2. Memeriksa potensi reaksi silang (cross-reactivity) golongan obat (contoh: alergi Penisilin vs Sefalosporin).
3. Memeriksa potensi interaksi obat berbahaya antar obat yang diresepkan bersamaan.
Kembalikan HANYA format JSON valid:
{
  "hasRisk": true,
  "severity": "RENDAH / SEDANG / TINGGI",
  "warning": "Deskripsi peringatan jelas untuk dokter...",
  "recommendation": "Saran alternatif terapi yang aman..."
}`;

    const prompt = `Riwayat Alergi Pasien: ${patientAllergies || 'Tidak ada riwayat alergi tercatat'}\nDaftar Obat yang Ditambahkan: ${medList}`;
    const rawResponse = await getClient().callGemini(prompt, systemPrompt, { temperature: 0.1 });
    const parsed = extractJson(rawResponse);
    return parsed || { hasRisk: false, severity: 'RENDAH', warning: '', recommendation: '' };
  };

  /**
   * 5. Chatbot FAQ & Informasi Operasional Klinik 24/7
   */
  const answerClinicFaq = async (userQuery, clinicContext = {}) => {
    const contextStr = JSON.stringify(clinicContext || {});
    const systemPrompt = `Anda adalah "Sasa", Asisten Cerdas SIMKLINIK.
Aturan Identitas & Branding:
- Perkenalkan diri HANYA sebagai "Sasa dari SIMKLINIK" atau "Sasa, Asisten Cerdas SIMKLINIK".
- DILARANG KERAS menyebutkan nama "Sehat Pratama" atau nama klinik fiktif lain. Fasilitas ini bernama "SIMKLINIK".

Jawab pertanyaan pengunjung seputar informasi klinik secara ringkas, to-the-point, dan ramah:
- Jadwal dokter praktik & poliklinik
- Alur berobat Pasien Umum vs BPJS Kesehatan
- Tarif konsultasi dasar dan fasilitas klinik
- Lokasi dan jam operasional: Senin - Sabtu 08.00 - 21.00 WIB.
Gunakan data klinik berikut jika relevan: ${contextStr}
Jika informasi spesifik tidak tercantum dalam data, berikan jawaban sopan dan arahkan menghubungi WhatsApp loket klinik.`;

    return await getClient().callGemini(userQuery, systemPrompt, { temperature: 0.3 });
  };

  /**
   * 6. Natural Language Analytics (Tanya Data Klinik)
   */
  const queryClinicalAnalytics = async (naturalQuery, clinicDatasetSummary = {}) => {
    const dataContext = JSON.stringify(clinicDatasetSummary || {});
    const systemPrompt = `Anda adalah Analis Data Klinis & Operasional SIMKLINIK.
Pengguna adalah Manajer/Petugas Klinik yang bertanya seputar performa operasional klinik.
Data Agregat Tersedia:
${dataContext}

Tugas:
1. Jawab pertanyaan dengan angka dan tren yang spesifik berdasarkan data di atas.
2. Sajikan dengan format:
   - 📊 **Ringkasan Eksekutif**
   - 📈 **Metrik Utama** (Persentase, Total Kunjungan, Status)
   - 💡 **Rekomendasi Manajerial Singkat**
Gaya bahasa profesional, data-driven, dan padat informasi.`;

    return await getClient().callGemini(naturalQuery, systemPrompt, { temperature: 0.2 });
  };

  const service = {
    setClient,
    getClient,
    triagePatient,
    explainMedications,
    generateSoapFromNotes,
    checkPrescriptionSafety,
    answerClinicFaq,
    queryClinicalAnalytics
  };

  if (typeof window !== 'undefined') {
    window.aiService = service;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = service;
  }
})();
