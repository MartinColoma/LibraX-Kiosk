const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

// Simple in-memory cache for DuckDuckGo search results
const searchCache = new Map();

const noSearchTriggers = [
  'hi', 'hello', 'hey', 'how are you', 'thanks', 'thank you', 'bye', 'ok',
  'who are you', 'help', 'what can you do', 'please',
  '?', '.', '!', 'cool', 'wow', 'yes', 'no', 'love', 'hate', 'repeat', 'again'
];

// Utility: Should we search DuckDuckGo for this message?
function needsSearch(message) {
  const msg = message.toLowerCase().trim();
  if (msg.length <= 2) return false;
  if (noSearchTriggers.some(trigger => msg.includes(trigger))) return false;
  if (/^[\?\.\!\s]+$/.test(msg)) return false;
  return true;
}

// Async DuckDuckGo search with timeout and cache
async function quickSearchDuckDuckGo(query) {
  // Use cache if available
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
    // Expire cache in 10 minutes
    setTimeout(() => searchCache.delete(query), 10 * 60 * 1000);
    return response.data;
  } catch (err) {
    return null;
  }
}

// Utility: Detect correction statements in user messages
function userIsCorrecting(message) {
  return /no|not correct|wrong|but/i.test(message.toLowerCase());
}

// Main route
router.post('/gemma', async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const doSearch = needsSearch(message);

    // DuckDuckGo search (if needed), in parallel
    const searchPromise = doSearch ? quickSearchDuckDuckGo(message) : Promise.resolve(null);

    // Use only last 5 chat history messages
    const recentChat = chatHistory.slice(-5);

    // Assemble prompt
    let conversation = '';
    for (const msg of recentChat) {
      conversation += `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}\n`;
    }
    conversation += `User: ${message}\n`;

    // Explicit instruction if user's message is a correction
    if (userIsCorrecting(message)) {
      conversation += "Note: The user says the previous answer is incorrect. Please use the most accurate info available.\n";
    }

    // Add DuckDuckGo results if present
    const searchResults = await searchPromise;
    if (searchResults && searchResults.AbstractText) {
      conversation += `Web search result: ${searchResults.AbstractText}\n`;
    } else if (doSearch) {
      conversation += `No relevant web search info was found for this query.\n`;
    }

    // Add instructions for factual queries
    if (doSearch) {
      conversation += "For factual questions, prefer to use recent, verified info from web search results before guessing. If unclear, say: 'I am unsure.'\n";
    }

    conversation += 'Bot:';

    // Send to FastAPI Gemma
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
