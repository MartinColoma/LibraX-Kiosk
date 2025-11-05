import React, { useState } from 'react';
import styles from './Chatbot.module.css'; // your CSS file

const initialMessages = [
  { id: 1, text: 'Welcome to LibraX!', sender: 'bot' },
  { id: 2, text: 'How can I help you?', sender: 'bot' },
];

// Function to fetch instant answers from DuckDuckGo API
async function fetchDuckDuckGoInstantAnswer(query: string): Promise<string> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('DuckDuckGo API error');
  const data = await response.json();

  if (data.AbstractText) return data.AbstractText;
  if (data.RelatedTopics && data.RelatedTopics.length > 0) {
    return data.RelatedTopics[0].Text || 'No relevant instant answer found.';
  }
  return 'No relevant instant answer found.';
}

// Function to fetch instant answers from Wikidata API
async function fetchWikidataInstantAnswer(query: string): Promise<string> {
  const endpointUrl = 'https://query.wikidata.org/sparql';
  const sparqlQuery = `
    SELECT ?item ?itemLabel ?description WHERE {
      ?item rdfs:label ?itemLabel.
      OPTIONAL { ?item schema:description ?description. }
      FILTER(CONTAINS(LCASE(?itemLabel), "${query.toLowerCase()}") && LANG(?itemLabel) = "en")
    }
    LIMIT 1
  `;
  const url = endpointUrl + '?query=' + encodeURIComponent(sparqlQuery) + '&format=json';

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' },
    });
    if (!response.ok) throw new Error('Wikidata API error');
    const data = await response.json();

    if (data.results.bindings.length > 0) {
      const binding = data.results.bindings[0];
      const label = binding.itemLabel.value || '';
      const description = binding.description ? binding.description.value : '';
      return description ? `${label}: ${description}` : label;
    }
    return 'No relevant instant answer found from Wikidata.';
  } catch {
    return 'Error accessing Wikidata API.';
  }
}

// Function to fetch NLP analysis from Wit.ai via backend (updated route)
async function fetchWitAIResponse(message: string): Promise<any> {
  const response = await fetch('https://librax-kiosk-api.onrender.com/witaichatbot/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error('Wit.ai backend error');
  }
  const data = await response.json();
  return data;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // For typing animation

  const handleSend = async () => {
    if (input.trim() === '') return;

    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, text: input, sender: 'user' },
    ]);

    const userInput = input;
    setInput('');
    setIsTyping(true); // show typing animation

    try {
      // Step 1: Get instant answers
      let duckAnswer = await fetchDuckDuckGoInstantAnswer(userInput);

      if (duckAnswer === 'No relevant instant answer found.') {
        duckAnswer = await fetchWikidataInstantAnswer(userInput);
      }

      // Step 2: Get Wit.ai NLP analysis
      let witReply = '';
      try {
        const witData = await fetchWitAIResponse(userInput);

        if (witData.intents?.length > 0) {
          const mainIntent = witData.intents[0].name;
          if (mainIntent === 'greet') witReply = 'Hello! How can I assist you?';
          else if (mainIntent === 'book_query') witReply = 'Let me help you with your book inquiry.';
          else witReply = `Intent detected: ${mainIntent}.`;
        } else {
          witReply = 'Sorry, I did not understand that.';
        }
        // Show entities if detected
        if (witData.entities && Object.keys(witData.entities).length > 0) {
          witReply += `\nEntities: ${Object.entries(witData.entities)
            .map(([key, val]) => `${key}: ${(val as any)[0].value}`)
            .join(', ')}`;
        }
      } catch (witErr) {
        witReply = 'Wit.ai service error.';
      }

      // Step 3: Combine Wit.ai + DuckDuckGo/Wikidata for bot reply
      const botReply = `Instant Answer: ${duckAnswer}\nWit.ai: ${witReply}`;

      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, text: botReply, sender: 'bot' },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, text: 'Error fetching data from APIs or AI service.', sender: 'bot' },
      ]);
    } finally {
      setIsTyping(false); // hide typing animation
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Header with collapse toggle */}
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <span>LibraX <b>ChatBot</b></span>
        <span className={styles.arrow}>{open ? '▼' : '▲'}</span>
      </div>
      {open && (
        <div className={styles.chatBody}>
          <div className={styles.messagesArea}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={msg.sender === 'user' ? styles.userBubble : styles.botBubble}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className={styles.botBubble}>
                <span className={styles.typing}>
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about books"
              className={styles.inputBox}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button className={styles.sendBtn} onClick={handleSend}>
              Ask about books
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
