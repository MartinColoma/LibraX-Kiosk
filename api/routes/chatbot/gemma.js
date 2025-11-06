const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://css-innovations-conclude-inspection.trycloudflare.com'; // <-- Replace with your tunnel URL

router.post('/gemma', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // Call the FastAPI Gemma endpoint via Cloudflare Tunnel URL
    const fastapiResponse = await axios.post(
      `${TUNNEL_URL}/predict`,
      { text: message },  // Matches your FastAPI payload
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const answer = fastapiResponse.data?.response || 'No answer from Gemma model.';
    res.json({ answer });
  } catch (error) {
    console.error('Error querying Gemma API via tunnel:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from Gemma model' });
  }
});

module.exports = router;
