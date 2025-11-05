const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Middleware to log incoming requests to /message
router.use((req, res, next) => {
  console.log(`[Wit.ai Route] ${req.method} ${req.originalUrl} - Body:`, req.body);
  next();
});

router.post('/message', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    console.log('[Wit.ai Route] Missing message in request body');
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    console.log(`[Wit.ai Route] Sending message to Wit.ai: "${message}"`);

    const response = await fetch(`https://api.wit.ai/message?v=20251105&q=${encodeURIComponent(message)}`, {
      headers: { Authorization: `Bearer ${process.env.WITAI_TOKEN}` }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Wit.ai Route] Wit.ai API responded with error:', response.status, response.statusText, errorBody);
      throw new Error(`Wit.ai API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Wit.ai Route] Wit.ai API response:', JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    console.error('[Wit.ai Route] Wit.ai request failed:', error);
    res.status(500).json({ error: 'Wit.ai request failed', details: error.message });
  }
});

module.exports = router;
