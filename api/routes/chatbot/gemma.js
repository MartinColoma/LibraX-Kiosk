const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

// In-memory cache for DuckDuckGo search results
const searchCache = new Map();

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
      timeout: 2000
    });
    searchCache.set(query, response.data);
    setTimeout(() => searchCache.delete(query), 10 * 60 * 1000);
    return response.data;
  } catch {
    return null;
  }
}

function userIsCorrecting(message) {
  return /no|not correct|wrong|but/i.test(message.toLowerCase());
}

router.post('/gemma', async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const searchResults = await quickSearchDuckDuckGo(message);
    const recentChat = chatHistory.slice(-5);

    let webSummary = '';
    if (searchResults) {
      if (searchResults.AbstractText) {
        webSummary = searchResults.AbstractText;
      } else if (searchResults.RelatedTopics?.length) {
        const topics = searchResults.RelatedTopics.slice(0, 2)
          .map(t => t.Text)
          .join(' | ');
        webSummary = topics || 'No relevant info found.';
      } else {
        webSummary = 'No relevant info found.';
      }
    }

    const conversation = `
You are LibraX — a friendly AI librarian that helps users with information about books, authors, songs, and general knowledge.

Your goals:
- Be conversational, friendly, and informative.
- If the search provides info, use it.
- If the search fails, politely admit you’re not sure, but try to infer context.
- Never just say “I’m not sure.” unless you truly have no clue.

Previous chat:
${recentChat.map(msg => `${msg.sender === 'user' ? 'User' : 'LibraX'}: ${msg.text}`).join('\n')}

New user message:
User: ${message}

Web search result summary:
${webSummary}

If the user is correcting you, acknowledge that briefly.

Now answer clearly and naturally as LibraX, in one or two sentences.
LibraX:
`;

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
