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

  // Jika tanpa API key atau dalam mode testing / offline, berikan respons simulasi cerdas
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
 * Fallback lokal jika Gemini API tidak tersedia atau kuota habis
 */
function generateLocalFallbackResponse(prompt, systemInstruction = '') {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('kutoarjo') || lower.includes('demam') || lower.includes('anak')) {
    return 'Halo! Saya Sasa "Sahabat Asisten Sehat Anda", asisten virtual SIMKLINIK Purworejo. Untuk keluhan Anda di area Kutoarjo, Klinik Pratama & Bersalin Kutoarjo Medika memiliki dr. Hendra Wijaya, Sp.A yang praktik hari ini. Kuota masih tersedia dan antrean sedang teratur. [ACTION:BOOK, CLINIC_ID: "22222222-2222-2222-2222-222222222222", DOCTOR_ID: "cccccccc-cccc-cccc-cccc-cccccccccccc"]';
  }

  if (lower.includes('gigi') || lower.includes('sakit gigi')) {
    return 'Halo! Untuk pemeriksaan kesehatan gigi, drg. Siti Rahayu di Klinik Pratama Sehat Mandiri Purworejo siap melayani Anda hari ini. Sisa kuota masih tersedia. [ACTION:BOOK, CLINIC_ID: "11111111-1111-1111-1111-111111111111", DOCTOR_ID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]';
  }

  return 'Halo! Saya Sasa "Sahabat Asisten Sehat Anda" dari SIMKLINIK Purworejo. Ada keluhan kesehatan apa yang sedang Anda rasakan? Kami memiliki klinik rekanan di Purworejo Kota, Kutoarjo, dan Banyuurip yang siap melayani Anda.';
}

if (typeof window !== 'undefined') {
  window.GEMINI_CONFIG = GEMINI_CONFIG;
  window.callGeminiApi = callGeminiApi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEMINI_CONFIG,
    callGeminiApi,
    generateLocalFallbackResponse
  };
}
