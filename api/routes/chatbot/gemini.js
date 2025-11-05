const express = require('express');
const router = express.Router();

// Dynamic import shim for node-fetch v3+ in CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // From your .env

// POST /chatbot/gemini endpoint
router.post('/gemini', async (req, res) => {
  console.log('Received request to /chatbot/gemini');
  
  const { message } = req.body;
  console.log('Request message:', message);
  
  if (!message || typeof message !== 'string') {
    console.log('Invalid message:', message);
    return res.status(400).json({ error: 'Missing or invalid message' });
  }

  try {
    const endpoint = 'https://gemini.googleapis.com/v1beta1/models/gemini-2.5:generateText';
    console.log('Calling Gemini API at:', endpoint);

    const body = {
      prompt: {
        text: message,
      },
      maxTokens: 150,
      temperature: 0.5,
    };
    console.log('Request body:', JSON.stringify(body));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error from Gemini API:', errorText);
      return res.status(response.status).json({ error: `Google API error: ${errorText}` });
    }

    const data = await response.json();
    console.log('Received data:', data);

    if (data?.candidates && data.candidates.length > 0) {
      const answer = data.candidates[0].output || 'No answer generated.';
      console.log('Generated answer:', answer);
      return res.json({ answer });
    } else {
      console.log('No candidates in response or empty candidates array');
      return res.json({ answer: 'No answer generated.' });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
