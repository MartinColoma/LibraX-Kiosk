const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

// In-memory cache for DuckDuckGo search results
const searchCache = new Map();

const noSearchTriggers = [
  'hi', 'hello', 'hey', 'how are you', 'thanks', 'thank you', 'bye', 'ok',
  'who are you', 'help', 'what can you do', 'please',
  '?', '.', '!', 'cool', 'wow', 'yes', 'no', 'repeat', 'again'
];

// Does this message need external search?
function needsSearch(message) {
  const msg = message.toLowerCase().trim();
  if (msg.length <= 2) return false;
  if (noSearchTriggers.some(trigger => msg.includes(trigger))) return false;
  if (/^[\?\.\!\s]+$/.test(msg)) return false;
  return true;
}

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
    // Always do search regardless of triggers
    const searchResults = await quickSearchDuckDuckGo(message);
    const recentChat = chatHistory.slice(-5);

    let conversation = '';
    for (const msg of recentChat) {
      conversation += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
    }
    conversation += `User: ${message}\n`;

    if (userIsCorrecting(message)) {
      conversation += "User believes your previous answer was inaccurate.\n";
    }

    // Always include search results or indicate no info found
    if (searchResults && searchResults.AbstractText) {
      conversation += `Web search result: ${searchResults.AbstractText}\n`;
    } else {
      conversation += "Web search result: No relevant info found.\n";
    }

    // Explicit instruction to answer questions clearly, concisely, avoid repetition,
    // and base answers on search + memory context.
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
