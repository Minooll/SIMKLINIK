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
    // 1. Determine serverless endpoint:
    // If running on localhost or file:, automatically connect to production Vercel serverless proxy!
    let endpoint = '/api/gemini';
    if (typeof window !== 'undefined') {
      const isLocalHost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.protocol === 'file:';
      if (isLocalHost) {
        endpoint = 'https://simklinik-one.vercel.app/api/gemini';
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction, ...options })
      });
      if (res.ok) {
        const data = await res.json();
        return data.text;
      }
      const errData = await res.json().catch(() => ({}));
      if (errData && errData.error) {
        throw new Error(errData.error);
      }
    } catch (netErr) {
      if (netErr.message && !netErr.message.includes('fetch') && !netErr.message.includes('Failed to')) {
        throw netErr;
      }
      // Serverless not reachable (e.g. offline), fallback to direct client call
    }

    // 2. Direct client fallback via Google Generative Language REST
    const localKey = getApiKey();
    if (!localKey) {
      throw new Error('NO_API_KEY: Kunci Gemini API belum diatur. Silakan atur di Vercel atau penyimpanan lokal.');
    }

    const candidateModels = [
      options.model,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite'
    ].filter(Boolean);
    let lastError = null;

    for (const m of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${localKey}`;
      const payload = buildGeminiPayload(prompt, systemInstruction, options);
      const directRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (directRes.ok) {
        const result = await directRes.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      lastError = await directRes.text();
    }

    throw new Error(`Gemini Error: ${lastError}`);
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
