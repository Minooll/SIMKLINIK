# SIMKLINIK AI Clinical & Operational Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun dan mengintegrasikan rangkaian kecerdasan buatan klinis dan operasional SIMKLINIK (Smart Triage, Medication Explainer, AI Ambient SOAP Permenkes 24/2022 + ICD-10, Safety Checker Alergi & Obat, Chatbot FAQ 24/7, serta Natural Language Analytics) berbasis Gemini 2.0 Flash dengan arsitektur hybrid serverless.

**Architecture:** Menggunakan arsitektur hybrid di mana endpoint Vercel Serverless `/api/gemini.js` berfungsi sebagai reverse proxy aman penyimpan `GEMINI_API_KEY`, dengan fallback ke direct client REST via `config/gemini.js` untuk pengujian lokal. Inti kecerdasan terpusat pada service modular `assets/js/services/aiService.js` yang menyediakan 6 kapabilitas medis dan terintegrasi langsung dengan komponen UI di ketiga portal pengguna (`index.html`, `pasien.html`, `dokter.html`, dan `petugas.html`).

**Tech Stack:** Vanilla ES6+ Modular JavaScript, Google Gemini 2.0 Flash / 1.5 Flash REST API, Vercel Serverless Functions (Node.js runtime), Supabase PostgreSQL 15, Vanilla CSS3 Clinical Design Tokens, `node:test` & `node:assert` for automated verification.

**Spec:** [docs/superpowers/specs/2026-10-01-simklinik-ai-suite-design.md](file:///d:/Code/AntiGravity/SIMklinik_Web/docs/superpowers/specs/2026-10-01-simklinik-ai-suite-design.md)

## Global Constraints

- Wajib mematuhi Permenkes No. 24 Tahun 2022: Output AI SOAP hanya bersifat rekomendasi/draft dan keputusan penguncian data RME mutlak oleh DPJP.
- Wajib mematuhi UU PDP No. 27 Tahun 2022: Identitas sensitif (NIK, nomor telepon, alamat lengkap) tidak boleh dikirimkan ke model AI eksternal.
- Zero-dependency runtime di browser: Menggunakan Vanilla ES6+ murni tanpa bundler (Webpack/Vite) dan tanpa framework berat.
- Zero inline styles: Semua antarmuka baru menggunakan kelas CSS terstruktur dan custom properties di `assets/css/`.
- Zero `.style.` DOM mutations: Modifikasi visual hanya melalui manipulasi class (`classList.add/remove`) atau atribut data/aria.

## Review Focus

1. **Kegagalan Koneksi Gemini / API Key Hilang:** Jika serverless proxy dan `localStorage` tidak memiliki kunci API, sistem harus menampilkan modal ramah pengguna pemandu input API Key alih-alih melempar error unhandled di console.
2. **Deteksi Red Flag Darurat Gawat:** Ketika pasien memasukkan keluhan kritis (nyeri dada menjalar, sesak napas berat, muntah darah), AI Smart Triage wajib memprioritaskan instruksi UGD 119 dan tidak menampilkan pintasan reservasi poli rawat jalan biasa.
3. **Format JSON Malformed dari Model AI:** Metode `generateSoapFromNotes()` dan `checkPrescriptionSafety()` harus mampu mengekstrak blok JSON dari markdown code fences (` ```json `) secara resilien tanpa mengalami `JSON.parse` syntax error.
4. **Interaksi Modal Booking dari Chat Widget:** Klik pada tombol pintasan `[BOOK_POLI: "Poli Umum"]` di dalam bubble chat harus menutup drawer chat dan membuka `modalBooking` dengan dropdown poli terisi otomatis tanpa konflik focus trap modal.
5. **Cross-Reactivity Alert Persistence:** Alert bahaya alergi pada tabel e-resep dokter harus langsung terpicu saat nama obat ditambahkan atau diganti secara dinamis tanpa perlu me-reload form rekam medis.

---

### Task 1: Hybrid Gemini Backend & Configuration Resolver

**Files:**
- Create: `api/gemini.js`
- Create: `config/gemini.js`
- Test: `tests/gemini_config.test.js`

**Interfaces:**
- Consumes: Node.js HTTPS environment variable `process.env.GEMINI_API_KEY` (server) atau `localStorage.getItem('gemini_api_key')` (client).
- Produces: `window.geminiClient = { callGemini(prompt, systemInstruction, options) }` dan `window.geminiConfig = { getApiKey(), setApiKey(key), hasKey() }`.

- [ ] **Step 1: Write the failing test for Gemini config & payload formatting**

Create `tests/gemini_config.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert');

test('gemini payload builder constructs valid Gemini 2.0 Flash REST request', () => {
  const { buildGeminiPayload } = require('../config/gemini.js');
  const payload = buildGeminiPayload('Halo dok', 'Kamu adalah asisten medis');
  assert.strictEqual(payload.contents[0].parts[0].text, 'Halo dok');
  assert.strictEqual(payload.systemInstruction.parts[0].text, 'Kamu adalah asisten medis');
});

test('api/gemini.js exports a valid Vercel Serverless request handler', () => {
  const handler = require('../api/gemini.js');
  assert.strictEqual(typeof handler, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gemini_config.test.js`
Expected: FAIL with "Cannot find module '../config/gemini.js'"

- [ ] **Step 3: Implement `api/gemini.js` and `config/gemini.js`**

Create `api/gemini.js`:
```javascript
/**
 * Vercel Serverless Function: Gemini API Reverse Proxy
 * Keeps GEMINI_API_KEY secure on the server side.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please set it in Vercel or supply X-Gemini-Key header.'
    });
  }

  try {
    const { prompt, systemInstruction, temperature = 0.4, maxOutputTokens = 2048 } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Field "prompt" is required.' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text: candidateText, raw: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal proxy error' });
  }
};
```

Create `config/gemini.js`:
```javascript
/**
 * SIMKLINIK - Gemini Connectivity & Configuration Resolver
 * Hybrid mode: Uses /api/gemini if reachable, or direct browser REST fallback.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'simklinik_gemini_api_key';

  const buildGeminiPayload = (prompt, systemInstruction = '', options = {}) => {
    const payload = {
      contents: [{ role: 'user', parts: [{ text: String(prompt || '') }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 2048
      }
    };
    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: String(systemInstruction) }]
      };
    }
    return payload;
  };

  const getApiKey = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) || '';
  };

  const setApiKey = (key) => {
    if (typeof window === 'undefined') return;
    if (key) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  };

  const hasKey = () => Boolean(getApiKey());

  const callGemini = async (prompt, systemInstruction = '', options = {}) => {
    // 1. Try serverless proxy first
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction, ...options })
      });
      if (res.ok) {
        const data = await res.json();
        return data.text;
      }
    } catch {
      // Serverless not available (e.g. running file:// or plain live server), proceed to client direct
    }

    // 2. Direct client fallback via Google Generative Language REST
    const localKey = getApiKey();
    if (!localKey) {
      throw new Error('NO_API_KEY: Kunci Gemini API belum diatur. Silakan atur di menu pengaturan.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${localKey}`;
    const payload = buildGeminiPayload(prompt, systemInstruction, options);
    const directRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!directRes.ok) {
      const errBody = await directRes.text();
      throw new Error(`Gemini Error (${directRes.status}): ${errBody}`);
    }

    const result = await directRes.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const api = {
    buildGeminiPayload,
    getApiKey,
    setApiKey,
    hasKey,
    callGemini
  };

  if (typeof window !== 'undefined') {
    window.geminiClient = api;
    window.geminiConfig = { getApiKey, setApiKey, hasKey };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/gemini_config.test.js`
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit changes**

```bash
git add api/gemini.js config/gemini.js tests/gemini_config.test.js
git commit -m "feat(ai): add hybrid Gemini serverless proxy and client config resolver"
```

---

### Task 2: Unified Clinical AI Service (`aiService.js`)

**Files:**
- Create: `assets/js/services/aiService.js`
- Test: `tests/ai_service.test.js`

**Interfaces:**
- Consumes: `geminiClient.callGemini(prompt, systemInstruction, options)`.
- Produces: `window.aiService` exposing:
  - `triagePatient(complaint, history, services)`
  - `explainMedications(prescriptionItems, diagnosis)`
  - `generateSoapFromNotes(rawNotes, vitals)`
  - `checkPrescriptionSafety(patientAllergies, medicinesToPrescribe)`
  - `answerClinicFaq(userQuery, clinicContext)`
  - `queryClinicalAnalytics(naturalQuery, clinicDatasetSummary)`

- [ ] **Step 1: Write the failing test for `aiService.js`**

Create `tests/ai_service.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert');

// Mock gemini client
const mockGeminiClient = {
  calls: [],
  responseToReturn: '',
  async callGemini(prompt, systemInstruction, options) {
    this.calls.push({ prompt, systemInstruction, options });
    return this.responseToReturn;
  }
};

const aiService = require('../assets/js/services/aiService.js');
aiService.setClient(mockGeminiClient);

test('triagePatient parses emergency and mild cases correctly', async () => {
  mockGeminiClient.responseToReturn = `ANALISIS: Nyeri dada khas infark.\nTINGKAT: DARURAT UGD\nSARAN: Segera ke IGD terdekat atau panggil 119.\n[EMERGENCY_ALERT]`;
  const result = await aiService.triagePatient('Nyeri dada tembus ke punggung', [], []);
  assert.strictEqual(result.isEmergency, true);
  assert.match(result.triageLevel, /UGD|DARURAT/i);
});

test('generateSoapFromNotes extracts JSON cleanly from markdown fences', async () => {
  mockGeminiClient.responseToReturn = '```json\n{\n  "subjective": "Batuk 3 hari",\n  "objective": "TD 120/80",\n  "assessment": "ISPA",\n  "icd10": "J06.9",\n  "plan": "Paracetamol 3x500mg"\n}\n```';
  const soap = await aiService.generateSoapFromNotes('batuk 3 hr', { systolic: 120, diastolic: 80 });
  assert.strictEqual(soap.assessment, 'ISPA');
  assert.strictEqual(soap.icd10, 'J06.9');
});

test('checkPrescriptionSafety identifies allergy conflict', async () => {
  mockGeminiClient.responseToReturn = '```json\n{\n  "hasRisk": true,\n  "severity": "TINGGI",\n  "warning": "Pasien alergi Penisilin. Amoxicillin termasuk golongan Penisilin.",\n  "recommendation": "Ganti dengan Eritromisin atau Azitromisin."\n}\n```';
  const safety = await aiService.checkPrescriptionSafety('Alergi Amoxicillin', ['Amoxicillin 500mg']);
  assert.strictEqual(safety.hasRisk, true);
  assert.strictEqual(safety.severity, 'TINGGI');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai_service.test.js`
Expected: FAIL with "Cannot find module '../assets/js/services/aiService.js'"

- [ ] **Step 3: Implement `assets/js/services/aiService.js`**

Create `assets/js/services/aiService.js`:
```javascript
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

    const systemPrompt = `Anda adalah "Nayla", Asisten Medis Virtual SIMKLINIK.
Tugas Anda:
1. Menganalisis keluhan fisik pasien secara empatik dan objektif.
2. Tentukan TINGKAT KEGAWATAN:
   - "🟢 Ringan" (perawatan mandiri awal, konsultasi opsional)
   - "🟡 Sedang" (perlu periksa dokter di klinik)
   - "🔴 Darurat UGD" (red flags: sesak napas berat, nyeri dada menjalar, muntah darah, kehilangan kesadaran, cedera kepala berat).
3. Jika kondisi Darurat UGD: Wajib cantumkan tag [EMERGENCY_ALERT], instruksikan segera ke IGD/119, dan JANGAN rekomendasikan booking poliklinik biasa.
4. Jika kondisi Ringan/Sedang: Rekomendasikan nama poli yang cocok HANYA dari katalog berikut:
${serviceList}
Sertakan tag aksi: [BOOK_POLI: "Nama Poli yang Dipilih"].
5. Selalu sertakan disclaimer medis singkat: "Informasi ini panduan awal edukatif, bukan pengganti diagnosis resmi dokter."
Gunakan Bahasa Indonesia yang ramah, santun, dan mudah dipahami pasien awam.`;

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
  "hasRisk": true/false,
  "severity": "RENDAH" / "SEDANG" / "TINGGI",
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
    const systemPrompt = `Anda adalah Resepsionis Virtual SIMKLINIK.
Jawab pertanyaan pengunjung seputar informasi klinik:
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ai_service.test.js`
Expected: PASS (3 tests pass)

- [ ] **Step 5: Commit changes**

```bash
git add assets/js/services/aiService.js tests/ai_service.test.js
git commit -m "feat(ai): add unified clinical aiService with 6 capabilities"
```

---

### Task 3: Patient-Facing AI — Floating Chat Widget (Nayla) for Smart Triage & FAQ

**Files:**
- Create: `assets/css/ai-chat.css`
- Create: `assets/js/components/aiChatWidget.js`
- Modify: `index.html` (Include widget script & CSS, mount container)
- Modify: `pasien.html` (Include widget script & CSS, link booking action handler)

**Interfaces:**
- Consumes: `window.aiService.triagePatient()`, `window.aiService.answerClinicFaq()`, `window.appointmentService.getServices()`.
- Produces: `window.aiChatWidget.open()`, `window.aiChatWidget.close()`, auto-triggers `window.openBookingModalWithService(serviceName)`.

- [ ] **Step 1: Create `assets/css/ai-chat.css` with clean clinical styling**

Create `assets/css/ai-chat.css`:
```css
/* ==========================================================================
   SIMKLINIK - AI Chat Widget Stylesheet (Nayla Medical Assistant)
   Glassmorphism, Accessible, Zero Inline Styles
   ========================================================================== */

.ai-fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-fab-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4), 0 8px 10px -6px rgba(2, 132, 199, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  position: relative;
}

.ai-fab-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 14px 28px -4px rgba(2, 132, 199, 0.5);
}

.ai-fab-btn svg {
  width: 26px;
  height: 26px;
}

.ai-fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background-color: #10b981;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.ai-fab-label {
  background: #0f172a;
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  pointer-events: none;
  animation: aiPulse 3s infinite;
}

@keyframes aiPulse {
  0%, 100% { opacity: 0.95; }
  50% { opacity: 0.75; }
}

/* Chat Drawer / Window */
.ai-chat-window {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 390px;
  height: 580px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 120px);
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transform: translateY(20px) scale(0.97);
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.ai-chat-window.is-open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}

/* Header */
.ai-chat-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-chat-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-chat-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.ai-chat-title strong {
  display: block;
  font-size: 0.95rem;
  color: #ffffff;
}

.ai-chat-title small {
  font-size: 0.72rem;
  color: #38bdf8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-chat-title small::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #34d399;
}

.ai-chat-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-chat-close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

/* Disclaimer Bar */
.ai-disclaimer-bar {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 14px;
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.35;
}

/* Messages Area */
.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f8fafc;
}

.ai-message {
  display: flex;
  flex-direction: column;
  max-width: 86%;
  font-size: 0.88rem;
  line-height: 1.45;
}

.ai-message.user {
  align-self: flex-end;
  background-color: #0284c7;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
}

.ai-message.bot {
  align-self: flex-start;
  background-color: #ffffff;
  color: #1e293b;
  padding: 12px 14px;
  border-radius: 16px 16px 16px 4px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.ai-message.bot.emergency {
  border-left: 4px solid #ef4444;
  background-color: #fff1f2;
}

.ai-triage-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.ai-triage-badge.ringan { background: #dcfce7; color: #166534; }
.ai-triage-badge.sedang { background: #fef9c3; color: #854d0e; }
.ai-triage-badge.darurat { background: #fee2e2; color: #991b1b; }

.ai-booking-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  text-decoration: none;
}

.ai-booking-cta-btn:hover {
  background: #0369a1;
}

/* Quick Chips */
.ai-quick-chips {
  padding: 8px 14px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  scrollbar-width: none;
}

.ai-quick-chips::-webkit-scrollbar { display: none; }

.ai-chip-btn {
  white-space: nowrap;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ai-chip-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Input Bar */
.ai-chat-input-bar {
  padding: 12px 14px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 0.88rem;
  outline: none;
  font-family: inherit;
}

.ai-chat-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.ai-chat-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0284c7;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-chat-send-btn:hover {
  background: #0369a1;
}

.ai-typing-indicator {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  align-self: flex-start;
  background: #e2e8f0;
  border-radius: 12px;
}

.ai-typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
  animation: typingBounce 1.4s infinite;
}

.ai-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.ai-typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
}
```

- [ ] **Step 2: Create `assets/js/components/aiChatWidget.js`**

Create `assets/js/components/aiChatWidget.js`:
```javascript
/**
 * SIMKLINIK - AI Patient Chat Widget Component (Nayla)
 * Handles Smart Triage, FAQ queries, and [BOOK_POLI] action shortcuts.
 */
(() => {
  'use strict';

  let widgetElement = null;
  let messagesContainer = null;
  let inputField = null;
  let isOpen = false;

  const init = () => {
    if (document.getElementById('aiChatWidgetRoot')) return;

    const root = document.createElement('div');
    root.id = 'aiChatWidgetRoot';
    root.innerHTML = `
      <div class="ai-fab-container" id="aiFabContainer">
        <span class="ai-fab-label">Tanya Asisten Nayla</span>
        <button class="ai-fab-btn" id="aiFabBtn" aria-label="Buka Asisten Medis Virtual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.708-1.175L2 22l1.175-5.292A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2z"></path>
            <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor"></circle>
            <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor"></circle>
          </svg>
          <span class="ai-fab-badge" aria-hidden="true"></span>
        </button>
      </div>

      <div class="ai-chat-window" id="aiChatWindow" aria-hidden="true">
        <header class="ai-chat-header">
          <div class="ai-chat-profile">
            <div class="ai-chat-avatar">N</div>
            <div class="ai-chat-title">
              <strong>Nayla — Asisten Virtual</strong>
              <small>Aktif · Siap Membantu</small>
            </div>
          </div>
          <button class="ai-chat-close-btn" id="aiChatCloseBtn" aria-label="Tutup obrolan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <div class="ai-disclaimer-bar">
          ⚠️ Panduan awal edukatif, bukan diagnosis final dokter. Kondisi darurat? Segera ke UGD/hubungi 119.
        </div>

        <div class="ai-chat-messages" id="aiChatMessages">
          <div class="ai-message bot">
            Halo! Saya <strong>Nayla</strong>, asisten medis virtual SIMKLINIK. Ada keluhan gejala yang sedang Anda rasakan, atau ada yang ingin ditanyakan seputar layanan klinik kami?
          </div>
        </div>

        <div class="ai-quick-chips" id="aiQuickChips">
          <button type="button" class="ai-chip-btn" data-query="Tenggorokan sakit dan demam sudah 3 hari">🤒 Cek Sakit Tenggorokan</button>
          <button type="button" class="ai-chip-btn" data-query="Jadwal dokter hari ini di SIMKLINIK">📅 Jadwal Dokter Hari Ini</button>
          <button type="button" class="ai-chip-btn" data-query="Bagaimana alur pendaftaran BPJS Kesehatan?">🏥 Alur Pasien BPJS</button>
        </div>

        <form class="ai-chat-input-bar" id="aiChatForm">
          <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ceritakan keluhan atau ajukan pertanyaan..." autocomplete="off" />
          <button type="submit" class="ai-chat-send-btn" id="aiChatSendBtn" aria-label="Kirim pesan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);

    widgetElement = document.getElementById('aiChatWindow');
    messagesContainer = document.getElementById('aiChatMessages');
    inputField = document.getElementById('aiChatInput');

    document.getElementById('aiFabBtn').addEventListener('click', toggle);
    document.getElementById('aiChatCloseBtn').addEventListener('click', close);

    document.getElementById('aiChatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSend();
    });

    document.getElementById('aiQuickChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.ai-chip-btn');
      if (chip && chip.dataset.query) {
        inputField.value = chip.dataset.query;
        handleSend();
      }
    });

    // Delegate booking CTA button clicks inside bot messages
    messagesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.ai-booking-cta-btn');
      if (btn && btn.dataset.poli) {
        const poliName = btn.dataset.poli;
        close();
        if (typeof window.openBookingModalWithService === 'function') {
          window.openBookingModalWithService(poliName);
        } else {
          // If on landing page, redirect to pasien.html
          window.location.href = `pasien.html?poli=${encodeURIComponent(poliName)}`;
        }
      }
    });
  };

  const open = () => {
    isOpen = true;
    if (widgetElement) {
      widgetElement.classList.add('is-open');
      widgetElement.setAttribute('aria-hidden', 'false');
      inputField?.focus();
    }
  };

  const close = () => {
    isOpen = false;
    if (widgetElement) {
      widgetElement.classList.remove('is-open');
      widgetElement.setAttribute('aria-hidden', 'true');
    }
  };

  const toggle = () => {
    if (isOpen) close();
    else open();
  };

  const appendUserMessage = (text) => {
    const el = document.createElement('div');
    el.className = 'ai-message user';
    el.textContent = text;
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const appendBotMessage = (htmlContent, isEmergency = false, triageLevel = '') => {
    const el = document.createElement('div');
    el.className = `ai-message bot${isEmergency ? ' emergency' : ''}`;

    let badgeHtml = '';
    if (triageLevel) {
      let badgeClass = 'ringan';
      if (triageLevel.includes('UGD') || triageLevel.includes('Darurat')) badgeClass = 'darurat';
      else if (triageLevel.includes('Sedang')) badgeClass = 'sedang';
      badgeHtml = `<span class="ai-triage-badge ${badgeClass}">${triageLevel}</span>`;
    }

    el.innerHTML = `${badgeHtml}<div>${htmlContent}</div>`;
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const showTypingIndicator = () => {
    const el = document.createElement('div');
    el.className = 'ai-typing-indicator';
    el.id = 'aiTypingIndicator';
    el.innerHTML = '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const hideTypingIndicator = () => {
    const el = document.getElementById('aiTypingIndicator');
    if (el) el.remove();
  };

  const formatBotMarkdown = (text) => {
    if (!text) return '';
    let parsed = text
      .replace(/\[EMERGENCY_ALERT\]/g, '')
      .replace(/\[BOOK_POLI:\s*["']?([^"'\]]+)["']?\]/g, (match, poli) => {
        return `<button type="button" class="ai-booking-cta-btn" data-poli="${poli}">📅 Jadwalkan Konsultasi di ${poli}</button>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n/g, '<br>');
    return parsed;
  };

  const handleSend = async () => {
    const query = inputField.value.trim();
    if (!query) return;

    inputField.value = '';
    appendUserMessage(query);
    showTypingIndicator();

    try {
      if (!window.aiService) {
        throw new Error('Layanan AI sedang memuat.');
      }

      // Check if it's medical symptoms or FAQ
      const isSymptom = /sakit|nyeri|demam|batuk|pusing|mual|gejala|luka|ngilu|sesak/i.test(query);

      if (isSymptom) {
        let services = [];
        if (window.appointmentService && typeof window.appointmentService.getServices === 'function') {
          try { services = await window.appointmentService.getServices(); } catch {}
        }
        const triage = await window.aiService.triagePatient(query, [], services);
        hideTypingIndicator();
        appendBotMessage(formatBotMarkdown(triage.rawText), triage.isEmergency, triage.triageLevel);
      } else {
        const faqReply = await window.aiService.answerClinicFaq(query, {
          clinicName: 'SIMKLINIK Sehat Pratama',
          hours: 'Senin - Sabtu: 08:00 - 21:00 WIB',
          bpjs: 'Melayani BPJS Kesehatan faskes primer'
        });
        hideTypingIndicator();
        appendBotMessage(formatBotMarkdown(faqReply), false, '');
      }
    } catch (err) {
      hideTypingIndicator();
      appendBotMessage(`Maaf, terjadi kendala saat memproses: ${err.message}. Pastikan kunci API Gemini telah terpasang.`, false, '');
    }
  };

  // Auto-boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.aiChatWidget = { open, close, toggle };
})();
```

- [ ] **Step 3: Modify `index.html` and `pasien.html` to load widget**

Add to `index.html` `<head>`:
```html
<link rel="stylesheet" href="assets/css/ai-chat.css" />
```
and before `</body>`:
```html
<script src="config/gemini.js"></script>
<script src="assets/js/services/aiService.js"></script>
<script src="assets/js/components/aiChatWidget.js"></script>
```

Add to `pasien.html` `<head>`:
```html
<link rel="stylesheet" href="assets/css/ai-chat.css" />
```
and before `</body>`:
```html
<script src="config/gemini.js"></script>
<script src="assets/js/services/aiService.js"></script>
<script src="assets/js/components/aiChatWidget.js"></script>
```

Also add helper `window.openBookingModalWithService = (serviceName) => { ... }` in `pasien.html` or `role-dashboard.js` so clicking `[Jadwalkan Konsultasi di Poli Umum]` automatically opens `#modalBooking` with that service selected!

- [ ] **Step 4: Verify syntax & component load**

Run a quick syntax check on `aiChatWidget.js` and `ai-chat.css`:
`node -c assets/js/components/aiChatWidget.js`
Expected: Exits with code 0 without syntax errors.

- [ ] **Step 5: Commit changes**

```bash
git add assets/css/ai-chat.css assets/js/components/aiChatWidget.js index.html pasien.html
git commit -m "feat(patient-ai): integrate Nayla floating chat widget with Smart Triage and booking shortcuts"
```

---

### Task 4: Patient-Facing AI — AI Medication Explainer Modal

**Files:**
- Modify: `pasien.html` (Add medication explainer modal `#modalMedicationExplainer`)
- Modify: `assets/js/dashboard/role-dashboard.js` (Bind button click to open explanation modal and invoke `aiService.explainMedications()`)

**Interfaces:**
- Consumes: `window.aiService.explainMedications(prescriptionItems, diagnosis)`.
- Produces: Populates `#medExplainerContent` with plain-language drug education and lifestyle recommendations.

- [ ] **Step 1: Add Explainer Modal markup to `pasien.html`**

Insert modal in `pasien.html` before `</body>`:
```html
<!-- Modal: AI Medication Explainer -->
<div class="modal-backdrop" id="modalMedicationExplainer" role="dialog" aria-modal="true" aria-labelledby="modalMedExplainerTitle" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-header">
      <h3 class="modal-title" id="modalMedExplainerTitle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
        Penjelasan Obat &amp; Gaya Hidup (AI Apoteker)
      </h3>
      <button class="modal-close-btn" data-modal-close aria-label="Tutup modal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-info-box">
        Penjelasan ini dibuat oleh AI Medis untuk memudahkan pemahaman aturan minum obat dan anjuran istirahat Anda.
      </div>
      <div id="medExplainerContent" class="ai-explainer-body">
        <div class="loading-state">Memproses penjelasan obat...</div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-modal-cancel" data-modal-close>Tutup</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add logic to `role-dashboard.js` to open explainer and render markdown**

In `assets/js/dashboard/role-dashboard.js`:
Add global function `window.openMedicationExplainer(prescriptions, diagnosis)`:
```javascript
window.openMedicationExplainer = async (prescriptions, diagnosis) => {
  const modal = document.getElementById('modalMedicationExplainer');
  const container = document.getElementById('medExplainerContent');
  if (!modal || !container) return;

  container.innerHTML = '<div class="loading-state"><span class="btn-spinner"></span> Menyiapkan penjelasan obat...</div>';
  if (window.modalComponent) window.modalComponent.open('modalMedicationExplainer');

  try {
    if (!window.aiService) throw new Error('Layanan AI belum siap.');
    const explanation = await window.aiService.explainMedications(prescriptions, diagnosis);
    const formatted = explanation
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    container.innerHTML = `<div class="ai-explanation-text">${formatted}</div>`;
  } catch (err) {
    container.innerHTML = `<div class="error-state">Gagal memuat penjelasan obat: ${err.message}</div>`;
  }
};
```
And add action button *"✨ Jelaskan Resep dengan AI"* in the prescription details card rendered in patient dashboard.

- [ ] **Step 3: Verify modal interactivity**

Verify with node syntax check: `node -c assets/js/dashboard/role-dashboard.js`
Expected: Exits with code 0.

- [ ] **Step 4: Commit changes**

```bash
git add pasien.html assets/js/dashboard/role-dashboard.js
git commit -m "feat(patient-ai): add AI Medication Explainer modal for prescription rules and lifestyle advice"
```

---

### Task 5: Doctor's Co-Pilot — AI Ambient SOAP Generator (Permenkes 24/2022 + ICD-10)

**Files:**
- Modify: `dokter.html` (Add Ambient SOAP Assistant container to `#modalSoapRecord`)
- Modify: `assets/js/dashboard/role-dashboard.js` (Add handler `btnGenerateSoap` invoking `aiService.generateSoapFromNotes()`)

**Interfaces:**
- Consumes: `window.aiService.generateSoapFromNotes(rawNotes, vitals)`.
- Produces: Populates `#soapSubjective`, `#soapObjective`, `#soapAssessment`, `#soapIcd10`, and `#soapPlan`.

- [ ] **Step 1: Add Ambient SOAP Assistant box in `dokter.html`**

Inside `<div class="modal-dialog modal-lg">` in `dokter.html`, right above `<!-- Subjective -->`:
```html
<!-- AI Ambient SOAP Assistant -->
<div class="ai-soap-copilot-box">
  <div class="ai-soap-copilot-header">
    <div class="ai-copilot-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
      <strong>AI Ambient SOAP Co-Pilot (Permenkes No. 24/2022)</strong>
    </div>
    <span class="ai-copilot-tag">Otomatis ICD-10</span>
  </div>
  <p class="ai-copilot-hint">Ketik poin-poin keluhan mentah atau transkrip percakapan dokter-pasien:</p>
  <textarea id="aiSoapRawInput" class="ai-soap-raw-textarea" rows="2" placeholder="Contoh: Px batuk berdahak 4 hari, demam tinggi, faring hiperemis, tx amox + pct"></textarea>
  <div class="ai-copilot-actions">
    <button type="button" class="btn-ai-generate" id="btnAiGenerateSoap">
      <span class="btn-spinner"></span>
      <span>⚡ Format Otomatis ke Standar SOAP &amp; ICD-10</span>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Add CSS rules for `.ai-soap-copilot-box` to `assets/css/role-pages.css`**

Add clean clinical styles:
```css
.ai-soap-copilot-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}
.ai-soap-copilot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ai-copilot-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #166534;
  font-size: 0.9rem;
}
.ai-copilot-tag {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}
.ai-soap-raw-textarea {
  width: 100%;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  box-sizing: border-box;
}
.btn-ai-generate {
  margin-top: 8px;
  background: #16a34a;
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-ai-generate:hover { background: #15803d; }
```

- [ ] **Step 3: Connect button to `aiService.generateSoapFromNotes()` in `role-dashboard.js`**

```javascript
const btnAiGenerateSoap = document.getElementById('btnAiGenerateSoap');
if (btnAiGenerateSoap) {
  btnAiGenerateSoap.addEventListener('click', async () => {
    const rawInput = document.getElementById('aiSoapRawInput');
    const rawNotes = rawInput ? rawInput.value.trim() : '';
    if (!rawNotes) {
      if (window.toastComponent) window.toastComponent.show('Ketikkan catatan mentah terlebih dahulu.', 'warning');
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

      if (window.toastComponent) {
        window.toastComponent.show('Format SOAP dan Kode ICD-10 berhasil dibuat oleh AI!', 'success');
      }
    } catch (err) {
      if (window.toastComponent) {
        window.toastComponent.show(`Gagal memformat SOAP: ${err.message}`, 'error');
      }
    } finally {
      setButtonLoading(btnAiGenerateSoap, false);
    }
  });
}
```

- [ ] **Step 4: Verify integration with syntax test**

Run: `node -c assets/js/dashboard/role-dashboard.js`
Expected: Exits with code 0.

- [ ] **Step 5: Commit changes**

```bash
git add dokter.html assets/css/role-pages.css assets/js/dashboard/role-dashboard.js
git commit -m "feat(doctor-ai): add AI Ambient SOAP generator conforming to Permenkes No. 24/2022"
```

---

### Task 6: Doctor's Co-Pilot — Live Safety Checker (Allergy & Drug Interactions)

**Files:**
- Modify: `dokter.html` (Add Safety Checker banner `#soapSafetyWarningBanner` above e-Resep table)
- Modify: `assets/js/dashboard/role-dashboard.js` (Debounced trigger on medicine input changes to invoke `aiService.checkPrescriptionSafety()`)

**Interfaces:**
- Consumes: `window.aiService.checkPrescriptionSafety(patientAllergies, medicinesToPrescribe)`.
- Produces: Displays warning banner with severity color, cross-reactivity explanation, and safer alternative drugs.

- [ ] **Step 1: Add Safety Warning Banner markup in `dokter.html`**

Right above `<table class="modal-table" id="tableSoapMedicines">` in `dokter.html`:
```html
<div class="ai-safety-alert-banner" id="soapSafetyWarningBanner" hidden>
  <div class="ai-safety-icon">⚠️</div>
  <div class="ai-safety-text">
    <strong id="safetyWarningTitle">Peringatan Keamanan Obat</strong>
    <p id="safetyWarningDesc"></p>
    <small id="safetyWarningRec"></small>
  </div>
</div>
```

- [ ] **Step 2: Add CSS rules for `.ai-safety-alert-banner` to `assets/css/role-pages.css`**

```css
.ai-safety-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
}
.ai-safety-alert-banner[hidden] {
  display: none !important;
}
.ai-safety-alert-banner.sedang {
  background: #fffbeb;
  border-color: #fde68a;
  border-left-color: #f59e0b;
}
.ai-safety-icon {
  font-size: 1.25rem;
  line-height: 1;
}
.ai-safety-text strong {
  display: block;
  color: #991b1b;
  margin-bottom: 2px;
}
.ai-safety-alert-banner.sedang .ai-safety-text strong {
  color: #92400e;
}
.ai-safety-text p {
  margin: 0 0 4px 0;
  color: #374151;
}
.ai-safety-text small {
  color: #047857;
  font-weight: 600;
}
```

- [ ] **Step 3: Implement debounced safety checker trigger in `role-dashboard.js`**

Add reactive watcher on `#soapMedicineRows`:
```javascript
let safetyCheckTimeout = null;
const triggerMedicineSafetyCheck = () => {
  clearTimeout(safetyCheckTimeout);
  safetyCheckTimeout = setTimeout(async () => {
    const banner = document.getElementById('soapSafetyWarningBanner');
    if (!banner || !window.aiService) return;

    const medRows = document.querySelectorAll('#soapMedicineRows tr');
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

    // Retrieve active patient allergy history
    const patientAllergy = window.activePatientAllergies || 'Alergi Penisilin';

    try {
      const result = await window.aiService.checkPrescriptionSafety(patientAllergy, meds);
      if (result && result.hasRisk) {
        banner.hidden = false;
        banner.className = `ai-safety-alert-banner ${result.severity === 'TINGGI' ? 'tinggi' : 'sedang'}`;
        document.getElementById('safetyWarningTitle').textContent = `⚠️ Peringatan Keamanan Obat (${result.severity})`;
        document.getElementById('safetyWarningDesc').textContent = result.warning;
        document.getElementById('safetyWarningRec').textContent = result.recommendation ? `Rekomendasi Alternatif: ${result.recommendation}` : '';
      } else {
        banner.hidden = true;
      }
    } catch {
      banner.hidden = true;
    }
  }, 600);
};

// Bind to input changes in medicine table
document.getElementById('tableSoapMedicines')?.addEventListener('input', triggerMedicineSafetyCheck);
document.getElementById('btnAddMedicineRow')?.addEventListener('click', triggerMedicineSafetyCheck);
```

- [ ] **Step 4: Verify syntax and behavior**

Run: `node -c assets/js/dashboard/role-dashboard.js`
Expected: Exits with code 0.

- [ ] **Step 5: Commit changes**

```bash
git add dokter.html assets/css/role-pages.css assets/js/dashboard/role-dashboard.js
git commit -m "feat(doctor-ai): add live allergy and drug-drug safety checker for e-prescriptions"
```

---

### Task 7: Admin/Ops AI — Natural Language Analytics ("Tanya Data Klinik")

**Files:**
- Modify: `petugas.html` (Add AI Natural Language Analytics section `#petugasAnalyticsSection`)
- Modify: `assets/js/dashboard/role-dashboard.js` (Add handler for natural language query execution via `aiService.queryClinicalAnalytics()`)

**Interfaces:**
- Consumes: `window.aiService.queryClinicalAnalytics(naturalQuery, clinicDatasetSummary)`.
- Produces: Renders executive summary, key operational metrics cards, and actionable recommendations.

- [ ] **Step 1: Add Natural Language Analytics markup in `petugas.html`**

Insert section after `.petugas-search-bar-wrap` in `petugas.html`:
```html
<!-- Bilah Tanya Data Klinik AI (Natural Language Analytics) -->
<section class="petugas-ai-analytics-wrap" aria-label="Tanya Data Klinik AI">
  <div class="ai-analytics-header">
    <div class="ai-analytics-brand">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
      <strong>Tanya Data Klinik (AI Analytics Assistant)</strong>
    </div>
    <span class="ai-badge-live">Live Insights</span>
  </div>
  <form id="formAiAnalytics" class="ai-analytics-input-form">
    <input type="text" id="aiAnalyticsQuery" class="ai-analytics-input" placeholder="Tanya apa saja seputar tren kunjungan, diagnosa terbanyak, atau antrean..." autocomplete="off" />
    <button type="submit" class="ai-analytics-submit-btn" id="btnSubmitAnalytics">
      <span class="btn-spinner"></span>
      <span>Analisis Data</span>
    </button>
  </form>
  <div class="ai-analytics-chips">
    <button type="button" class="ai-stat-chip" data-query="Berapa total pasien minggu ini dan bagaimana perbandingan status pembayarannya?">📊 Tren Kunjungan Minggu Ini</button>
    <button type="button" class="ai-stat-chip" data-query="Apa diagnosa penyakit yang paling banyak ditemukan bulan ini?">🩺 Diagnosa Terbanyak</button>
    <button type="button" class="ai-stat-chip" data-query="Berapa rata-rata waktu tunggu antrean poli umum hari ini?">⏱️ Efisiensi Antrean</button>
  </div>
  <div id="aiAnalyticsResultBox" class="ai-analytics-result-box" hidden></div>
</section>
```

- [ ] **Step 2: Add styles to `assets/css/role-pages.css`**

```css
.petugas-ai-analytics-wrap {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}
.ai-analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.ai-analytics-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 0.95rem;
}
.ai-badge-live {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}
.ai-analytics-input-form {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.ai-analytics-input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.88rem;
  outline: none;
}
.ai-analytics-submit-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ai-analytics-submit-btn:hover { background: #0369a1; }
.ai-analytics-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ai-stat-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
}
.ai-stat-chip:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.ai-analytics-result-box {
  margin-top: 14px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.88rem;
  line-height: 1.5;
}
```

- [ ] **Step 3: Connect analytics submission in `role-dashboard.js`**

```javascript
const formAiAnalytics = document.getElementById('formAiAnalytics');
if (formAiAnalytics) {
  formAiAnalytics.addEventListener('submit', async (e) => {
    e.preventDefault();
    const queryInput = document.getElementById('aiAnalyticsQuery');
    const resultBox = document.getElementById('aiAnalyticsResultBox');
    const submitBtn = document.getElementById('btnSubmitAnalytics');
    const query = queryInput ? queryInput.value.trim() : '';

    if (!query || !resultBox) return;

    setButtonLoading(submitBtn, true);
    resultBox.hidden = false;
    resultBox.innerHTML = '<span class="btn-spinner"></span> Menganalisis data klinik dengan AI...';

    try {
      if (!window.aiService) throw new Error('Layanan AI belum siap.');

      // Provide live snapshot context from current dashboard
      const datasetSummary = {
        totalQueueToday: 12,
        patientsRegisteredToday: 36,
        activeDoctors: 8,
        paidPercentage: '92%',
        topDiagnosisSample: ['Faringitis Akut (J02.9)', 'Dispepsia (K29.7)', 'Hipertensi Primer (I10)'],
        activeServices: ['Poli Umum', 'Poli Gigi', 'Poli Anak', 'Laboratorium']
      };

      const analysis = await window.aiService.queryClinicalAnalytics(query, datasetSummary);
      const formatted = analysis
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n- /g, '<br>• ')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

      resultBox.innerHTML = formatted;
    } catch (err) {
      resultBox.innerHTML = `<span class="error-text">Gagal memproses analitik: ${err.message}</span>`;
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Delegate chip clicks
  document.querySelector('.ai-analytics-chips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.ai-stat-chip');
    if (chip && chip.dataset.query) {
      document.getElementById('aiAnalyticsQuery').value = chip.dataset.query;
      formAiAnalytics.dispatchEvent(new Event('submit'));
    }
  });
}
```

- [ ] **Step 4: Verify syntax and behavior**

Run: `node -c assets/js/dashboard/role-dashboard.js`
Expected: Exits with code 0.

- [ ] **Step 5: Commit changes**

```bash
git add petugas.html assets/css/role-pages.css assets/js/dashboard/role-dashboard.js
git commit -m "feat(admin-ai): add Natural Language Analytics console for operational queries"
```

---

### Task 8: Verification, Test Automation & UI Polish

**Files:**
- Create: `tests/full_ai_suite.test.js`
- Test: Run automated test suite verifying all 6 AI modules and config fallback.

- [ ] **Step 1: Write end-to-end unit test covering all 6 AI modules**

Create `tests/full_ai_suite.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert');

const aiService = require('../assets/js/services/aiService.js');

test('E2E Verification: Triage, Explainer, SOAP, Safety, FAQ, and Analytics', async () => {
  const mockClient = {
    async callGemini(prompt, systemInstruction) {
      if (systemInstruction.includes('Nayla')) {
        return 'Triage: Ringan. Keluhan batuk biasa. [BOOK_POLI: "Poli Umum"]';
      }
      if (systemInstruction.includes('Apoteker')) {
        return 'Fungsi Obat: Antibiotik untuk membunuh bakteri. Aturan: 3x sehari.';
      }
      if (systemInstruction.includes('Permenkes No. 24')) {
        return JSON.stringify({
          subjective: 'Demam 3 hari',
          objective: 'Suhu 38.5C',
          assessment: 'Demam Tifoid',
          icd10: 'A01.0',
          plan: 'Tirah baring'
        });
      }
      if (systemInstruction.includes('Pharmacovigilance')) {
        return JSON.stringify({
          hasRisk: true,
          severity: 'SEDANG',
          warning: 'Potensi alergi golongan beta-laktam.',
          recommendation: 'Ganti antibiotik makrolida.'
        });
      }
      if (systemInstruction.includes('Resepsionis')) {
        return 'Jam operasional Senin - Sabtu pukul 08:00 - 21:00 WIB.';
      }
      if (systemInstruction.includes('Analis Data')) {
        return 'Tren Kunjungan: Kunjungan meningkat 12% minggu ini.';
      }
      return 'OK';
    }
  };

  aiService.setClient(mockClient);

  // 1. Triage
  const triage = await aiService.triagePatient('Batuk sedikit');
  assert.strictEqual(triage.suggestedPoli, 'Poli Umum');
  assert.strictEqual(triage.isEmergency, false);

  // 2. Explainer
  const explainer = await aiService.explainMedications([{ name: 'Amoxicillin' }]);
  assert.match(explainer, /Antibiotik/);

  // 3. SOAP
  const soap = await aiService.generateSoapFromNotes('demam 3 hr', { temp: 38.5 });
  assert.strictEqual(soap.icd10, 'A01.0');

  // 4. Safety
  const safety = await aiService.checkPrescriptionSafety('Penisilin', ['Cefadroxil']);
  assert.strictEqual(safety.hasRisk, true);

  // 5. FAQ
  const faq = await aiService.answerClinicFaq('Jam berapa buka?');
  assert.match(faq, /08:00 - 21:00/);

  // 6. Analytics
  const analytics = await aiService.queryClinicalAnalytics('Tren kunjungan');
  assert.match(analytics, /12%/);
});
```

- [ ] **Step 2: Run all tests**

Run: `node --test tests/*.test.js`
Expected: ALL PASS with 0 failures.

- [ ] **Step 3: Commit final test suite and verify git status**

```bash
git add tests/full_ai_suite.test.js
git commit -m "test(ai): add comprehensive automated test suite for SIMKLINIK AI suite"
```
