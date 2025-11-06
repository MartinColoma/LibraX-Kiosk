const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

async function quickSearchDuckDuckGo(query) {
  try {
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_redirect: 1,
        no_html: 1,
        skip_disambig: 1,
      }
    });
    return response.data;
  } catch {
    return null;
  }
}

router.post('/gemma', async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // Start DuckDuckGo search without awaiting right away
    const quickSearchPromise = quickSearchDuckDuckGo(message);

    // Build chat prompt minimal immediately (to save time)
    let conversation = '';
    for (const msg of chatHistory.slice(-5)) {  // Limit chat history to last 5 messages
      conversation += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
    }
    conversation += `User: ${message}\n`;

    // Await DuckDuckGo search result and add search context if available
    const searchResults = await quickSearchPromise;
    if (searchResults && searchResults.AbstractText) {
      conversation += `Quick search info: ${searchResults.AbstractText}\n`;
    }
    conversation += 'Bot:';

    // Send prompt to FastAPI model
    const fastapiResponse = await axios.post(
      `${TUNNEL_URL}/predict`,
      { text: conversation },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const answer = fastapiResponse.data?.response || 'No answer from Gemma model.';
    res.json({ answer });
  } catch (error) {
    console.error('Error querying Gemma API via tunnel:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from Gemma model' });
  }
});

module.exports = router;
