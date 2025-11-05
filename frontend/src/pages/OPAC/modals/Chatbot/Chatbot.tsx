import React, { useState } from 'react';
import styles from './Chatbot.module.css';

const initialMessages = [
  { id: 1, text: 'Welcome to LibraX Chatbot!', sender: 'bot' },
  { id: 2, text: 'I can help with book titles, authors, and release dates. What would you like to know?', sender: 'bot' },
];

async function fetchGeminiAnswer(message: string): Promise<string> {
  const response = await fetch('https://librax-kiosk-api.onrender.com/chatbot/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Gemini API backend error');
  const data = await response.json();
  return data.answer || 'No answer from Gemini.';
}

const isBookRelatedQuery = (query: string): boolean => {
  const keywords = [
    'book', 'author', 'title', 'release date', 'published', 'publisher',
    'novel', 'story', 'series', 'volume', 'edition', 'isbn', 'literature'
  ];
  const qLower = query.toLowerCase();
  return keywords.some(keyword => qLower.includes(keyword));
};

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '') return;

    setMessages(prev => [...prev, { id: prev.length + 1, text: input, sender: 'user' }]);
    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      if (!isBookRelatedQuery(userInput)) {
        setMessages(prev => [
          ...prev,
          { id: prev.length + 1, text: "Sorry, I only answer book-related questions. Please ask about an author, title, or book release.", sender: 'bot' },
        ]);
      } else {
        const geminiAnswer = await fetchGeminiAnswer(userInput);
        setMessages(prev => [...prev, { id: prev.length + 1, text: geminiAnswer, sender: 'bot' }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { id: prev.length + 1, text: `Error: ${error.message}`, sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <span><b>LibraX Chatbot</b></span>
        <span className={styles.arrow}>{open ? '▼' : '▲'}</span>
      </div>
      {open && (
        <div className={styles.chatBody}>
          <div className={styles.messagesArea}>
            {messages.map(msg => (
              <div key={msg.id} className={msg.sender === 'user' ? styles.userBubble : styles.botBubble}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className={styles.botBubble}>
                <span className={styles.typing}><span>.</span><span>.</span><span>.</span></span>
              </div>
            )}
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={input}
              placeholder="Ask about books, authors, or release dates"
              className={styles.inputBox}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={input.trim() === ''}>
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
