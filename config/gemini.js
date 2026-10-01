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
      // Serverless not reachable (e.g. static preview or local file), fallback to direct client call
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
