import React, { useState } from 'react';
import styles from './Chatbot.module.css'; // your CSS file

const initialMessages = [
  { id: 1, text: 'Welcome to LibraX!', sender: 'bot' },
  { id: 2, text: 'How can I help you?', sender: 'bot' },
];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, text: input, sender: 'user' },
    ]);
    setInput('');
    // You can simulate bot response here if needed
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
                className={msg.sender === 'user'
                  ? styles.userBubble
                  : styles.botBubble}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about books"
              className={styles.inputBox}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
            >
              Ask about books
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

