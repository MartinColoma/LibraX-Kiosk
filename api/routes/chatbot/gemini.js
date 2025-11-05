const express = require('express');
const router = express.Router();

// node-fetch shim
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Your Gemini API key

router.post('/gemini', async (req, res) => {
  console.log('Received request to /chatbot/gemini');

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    console.log('Calling Gemini API at:', endpoint);

    const body = {
      contents: [
        {
          parts: [{ text: message }]
        }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GOOGLE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error from Gemini API:', data);
      return res.status(response.status).json({ error: data });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    console.log('Generated answer:', answer);
    res.json({ answer });
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
