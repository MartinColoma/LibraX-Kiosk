const express = require('express');
const axios = require('axios');
const router = express.Router();

const TUNNEL_URL = 'https://reading-interfaces-games-cingular.trycloudflare.com'; // your tunnel URL

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

    let webSummary = 'No relevant info found.';
    if (searchResults) {
      if (searchResults.AbstractText) {
        webSummary = searchResults.AbstractText;
      } else if (searchResults.RelatedTopics?.length) {
        webSummary = searchResults.RelatedTopics.slice(0, 2)
          .map(t => t.Text)
          .join(' | ');
      }
    }

    const systemPrompt = `
You are LibraX — a helpful, friendly AI librarian that assists users with questions about books, authors, songs, and general knowledge.
Use a natural, conversational tone.
If information from the search is available, use it directly.
If not, give your best educated answer or politely admit uncertainty.
Never repeat instructions or say "I'm ready."
    `.trim();

    const conversationMessages = [
      { role: "system", content: systemPrompt },
      ...recentChat.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: `${message}\nWeb search: ${webSummary}` }
    ];

    const fastapiResponse = await axios.post(
      `${TUNNEL_URL}/predict`,
      { messages: conversationMessages },
      { headers: { "Content-Type": "application/json" } }
    );

    const answer = fastapiResponse.data?.response || "No answer from Gemma model.";
    res.json({ answer });
  } catch (error) {
    console.error("Error querying Gemma API via tunnel:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get response from Gemma model" });
  }
});

module.exports = router;
