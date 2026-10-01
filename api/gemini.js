// Cache the fastest responsive model across serverless invocations
let lastWorkingModel = 'gemini-3.5-flash';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
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

    const { prompt, systemInstruction, model, temperature = 0.4, maxOutputTokens = 1500 } = req.body || {};
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

    // Prioritize cached last working model, then gemini-3.5-flash and gemini-3.5-flash-lite for ultra-fast chat responses
    const candidateModels = Array.from(new Set([
      model,
      lastWorkingModel,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite'
    ])).filter(Boolean);
    const attempts = [];

    for (const m of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          lastWorkingModel = m; // Remember the fast working model for subsequent requests
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return res.status(200).json({ text: candidateText, modelUsed: m, raw: data });
        }

        const errText = await response.text();
        attempts.push({ model: m, status: response.status, error: errText });
      } catch (reqErr) {
        attempts.push({ model: m, status: 0, error: reqErr.message });
      }
    }

    return res.status(502).json({ error: 'All models failed', attempts });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal proxy error' });
  }
};
