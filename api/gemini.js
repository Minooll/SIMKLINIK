/**
 * Vercel Serverless Function: Gemini API Reverse Proxy
 * Keeps GEMINI_API_KEY secure on the server side.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || (req.headers && req.headers['x-gemini-key']);
  if (!apiKey) {
    return res.status(401).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please set it in Vercel or supply X-Gemini-Key header.'
    });
  }

  try {
    if (req.body && req.body.listModels) {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      return res.status(listRes.status).json(listData);
    }

    const { prompt, systemInstruction, model, temperature = 0.4, maxOutputTokens = 2048 } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Field "prompt" is required.' });
    }

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

    // Try user-specified model or cascade through common Gemini models
    const candidateModels = [model, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.0-flash'].filter(Boolean);
    const attempts = [];

    for (const m of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({ text: candidateText, modelUsed: m, raw: data });
      }

      const errText = await response.text();
      attempts.push({ model: m, status: response.status, error: errText });
    }

    return res.status(502).json({ error: 'All models failed', attempts });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal proxy error' });
  }
};
