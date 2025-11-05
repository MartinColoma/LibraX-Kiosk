const express = require('express');
const router = express.Router();

// Dynamic import shim for node-fetch v3+ in CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // From your .env

// POST /chatbot/gemini endpoint
router.post('/gemini', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid message' });
  }

  try {
    const endpoint = 'https://gemini.googleapis.com/v1beta1/models/gemini-2.5:generateText';

    const body = {
      prompt: {
        text: message,
      },
      maxTokens: 150,
      temperature: 0.5,
    };

    // Await the fetch call since fetch itself is async here
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Google API error: ${errorText}` });
    }

    const data = await response.json();

    if (data?.candidates && data.candidates.length > 0) {
      const answer = data.candidates[0].output || 'No answer generated.';
      return res.json({ answer });
    } else {
      return res.json({ answer: 'No answer generated.' });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
