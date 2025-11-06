const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

// In-memory cache for DuckDuckGo search results (simple)
const searchCache = new Map();

const noSearchTriggers = [
  'hi', 'hello', 'hey', 'how are you', 'thanks', 'thank you', 'bye', 'ok',
  'who are you', 'help', 'what can you do', '?', '.', '!', 'please'
];

// Determine if DuckDuckGo search is needed
function needsSearch(message) {
  const msg = message.toLowerCase();
  // Skip short or common phrases, or any message containing only punctuation
  if (msg.length <= 2) return false;
  if (noSearchTriggers.some(trigger => msg.includes(trigger))) return false;
  // Skip if message looks like just punctuation
  if (/^[\?\.\!\s]+$/.test(msg)) return false;
  return true;
}

// Async DuckDuckGo search with timeout
async function quickSearchDuckDuckGo(query) {
  // Use cached if available
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
      timeout: 1500   // 1.5 seconds timeout
    });
    searchCache.set(query, response.data);
    // Cache cleanup after 10 mins
    setTimeout(() => searchCache.delete(query), 10 * 60 * 1000);
    return response.data;
  } catch {
    return null;
  }
}

router.post('/gemma', async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const doSearch = needsSearch(message);

    // Start DuckDuckGo search early if needed
    const searchPromise = doSearch ? quickSearchDuckDuckGo(message) : Promise.resolve(null);

    // Limit chat history to last 5 messages (reduce prompt size)
    const recentChat = chatHistory.slice(-5);

    // Build prompt base immediately
    let conversation = '';
    for (const msg of recentChat) {
      conversation += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
    }
    conversation += `User: ${message}\n`;

    // Wait for DuckDuckGo search (or skip)
    const searchResults = await searchPromise;
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
