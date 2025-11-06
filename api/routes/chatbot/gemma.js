const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com';
// your tunnel URL

// Example function that calls DuckDuckGo Instant Answer API
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
    // Step 1: Use a simple heuristic or external service to detect if quick search is needed
    const needsSearch = /* your logic here, e.g., assume true for now */ true;
    
    let searchContext = '';
    if (needsSearch) {
      const searchResults = await quickSearchDuckDuckGo(message);
      // Extract relevant info from searchResults to include in prompt
      if (searchResults && searchResults.AbstractText) {
        searchContext = `Quick search info: ${searchResults.AbstractText}`;
      }
    }

    // Step 2: Build the prompt input to Gemma combining chat history, user message, and context
    let conversation = '';
    for (const msg of chatHistory) {
      conversation += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
    }
    conversation += `User: ${message}\n${searchContext ? searchContext + '\n' : ''}Bot:`;

    // Step 3: Send prompt to FastAPI Gemma model
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
