const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

// In-memory cache for DuckDuckGo search results
const searchCache = new Map();

// DuckDuckGo search with timeout and cache
async function quickSearchDuckDuckGo(query) {
  if (searchCache.has(query)) return searchCache.get(query);

  try {
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_redirect: 1,
        no_html: 1,
        skip_disambig: 1,
      },
      timeout: 1500
    });
    searchCache.set(query, response.data);
    setTimeout(() => searchCache.delete(query), 10 * 60 * 1000);
    return response.data;
  } catch {
    return null;
  }
}

// Detects correction feedback
function userIsCorrecting(message) {
  return /no|not correct|wrong|but/i.test(message.toLowerCase());
}

router.post('/gemma', async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const searchResults = await quickSearchDuckDuckGo(message);
    const recentChat = chatHistory.slice(-5);

    let conversation = 'This is what we have in our previous chat:\n';
    for (const msg of recentChat) {
      conversation += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
    }
    conversation += `User: ${message}\n`;

    if (userIsCorrecting(message)) {
      conversation += "User believes your previous answer was inaccurate.\n";
    }

    if (searchResults && searchResults.AbstractText) {
      conversation += `Web search result: ${searchResults.AbstractText}\n`;
    } else {
      conversation += "Web search result: No relevant info found.\n";
    }

    conversation += `Answer the user's question clearly and concisely without repeating their exact words. Use the information from the web search result and past conversation. If uncertain, say 'I'm not sure.'\nBot:`;

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
