const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Put your key in .env

// Handle POST /chatbot/gemini with JSON body { message: "user query" }
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
      res.json({ answer });
    } else {
      res.json({ answer: 'No answer generated.' });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
