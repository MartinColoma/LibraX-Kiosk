import React, { useState, useRef, useEffect } from 'react';
import styles from './Chatbot.module.css';

const initialMessages = [
  { id: 1, text: 'Welcome to LibraX!', sender: 'bot' },
  { id: 2, text: 'How can I help you?', sender: 'bot' },
];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;
    const userInput = input;
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, text: userInput, sender: 'user' }
    ]);
    setInput('');
    try {
      const res = await fetch('/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      });
      const data = await res.json();
      const botResponse = data.response || 'Sorry, no response.';
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, text: botResponse, sender: 'bot' }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, text: 'Error contacting server.', sender: 'bot' }
      ]);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <span>LibraX ChatBot</span>
        <span className={styles.arrow}>{open ? '▼' : '▲'}</span>
      </div>
      {open && (
        <div className={styles.chatBody}>
          <div className={styles.messagesArea}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={msg.sender === 'user' 
                  ? styles.userBubble 
                  : styles.botBubble}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about books..."
              className={styles.inputBox}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
