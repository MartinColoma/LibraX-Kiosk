const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/message', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const response = await fetch(`https://api.wit.ai/message?v=20251105&q=${encodeURIComponent(message)}`, {
      headers: { Authorization: `Bearer ${process.env.WITAI_TOKEN}` }
    });

    if (!response.ok) {
      throw new Error('Wit.ai API error');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Wit.ai request failed' });
  }
});

module.exports = router;
