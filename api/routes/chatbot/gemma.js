const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your Cloudflare tunnel

// --- Simple in-memory cache for quick searches ---
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
      timeout: 2000,
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

// --- Main chatbot route ---
router.post('/gemma', async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // 🔍 Quick web search for context
    const searchResults = await quickSearchDuckDuckGo(message);
    const recentChat = chatHistory.slice(-5);

    let webSummary = 'No relevant info found.';
    if (searchResults) {
      if (searchResults.AbstractText) {
        webSummary = searchResults.AbstractText;
      } else if (searchResults.RelatedTopics?.length) {
        webSummary = searchResults.RelatedTopics
          .slice(0, 2)
          .map((t) => t.Text)
          .join(' | ');
      }
    }

    // 🧠 System prompt for personality
    const systemPrompt = `
You are LibraX — a friendly, helpful AI librarian.
You assist users with questions about books, authors, songs, and general knowledge.
Speak naturally and conversationally, as if chatting with a library visitor.
If you have info from the search, use it.
If not, answer with your best knowledge or say you're unsure.
Avoid repeating instructions or saying “I'm ready.”
    `.trim();

    // 💬 Format chat history into structured messages
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...recentChat.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: `${message}\nWeb search: ${webSummary}` },
    ];

    // 🚀 Send to FastAPI model via tunnel
    let fastapiResponse;
    try {
      fastapiResponse = await axios.post(
        `${TUNNEL_URL}/predict`,
        { messages: conversationMessages },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000, // ⏳ Wait up to 60 seconds for slow CPU inference
        }
      );
    } catch (err) {
      console.error('❌ Tunnel/Model error:', err.message);
      return res
        .status(502)
        .json({ error: 'The AI model took too long or is unreachable.' });
    }

    const answer =
      fastapiResponse.data?.response?.trim() || 'No response from the model.';
    res.json({ answer });
  } catch (error) {
    console.error(
      'Error querying Gemma API via tunnel:',
      error.response?.data || error.message
    );
    res.status(500).json({ error: 'Failed to get response from Gemma model' });
  }
});

module.exports = router;
