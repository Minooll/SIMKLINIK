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
