import React, { useState } from 'react';
import styles from './Chatbot.module.css';

const initialMessages = [
  { id: 1, text: 'Welcome to LibraX Chatbot!', sender: 'bot' },
  { id: 2, text: 'I can help with book titles, authors, and release dates. What would you like to know?', sender: 'bot' },
];

async function fetchGemmaAnswer(message: string): Promise<string> {
  const response = await fetch('https://librax-kiosk-api.onrender.com/chatbot/gemma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Gemma API backend error');
  const data = await response.json();
  return data.answer || 'No answer from Gemma.';
}

const isBookRelatedQuery = (query: string): boolean => {
  const keywords = [
    // same keywords list as before
    'book', 'author', 'title', 'release date', 'published', 'publisher',
    'novel', 'story', 'series', 'volume', 'edition', 'isbn', 'literature',
    'writer', 'written', 'write', 'writing', 'fiction', 'non-fiction',
    'best-seller', 'plot', 'characters', 'reviews', 'summary', 'synopsis',
    'chapter', 'pages', 'read', 'reading', 'recommendation', 'recommend',
    'harry potter', 'dune', 'tolkien', 'rowling', 'martin', 'asimov',
    'biography', 'memoir', 'prologue', 'epilogue', 'theme', 'genre',
    'author of', 'who wrote', 'when was', 'first published', 'latest book',
    'upcoming book', 'book release', 'book launch', 'book sale', 'book club',
    'literary', 'classic', 'award-winning', 'bestselling', 'publisher',
    'literature', 'based on a book', 'book adaptation', 'audiobook',
    'e-book', 'paperback', 'hardcover', 'print edition', 'bookstore',
    'library', 'reading list', 'book signing', 'book festival', 'reading challenge',
    'book genre', 'historical fiction', 'science fiction', 'fantasy',
    'romance novel', 'mystery novel', 'thriller', 'nonfiction',
    'children’s book', 'young adult', 'YA novel', 'graphic novel',
    'book title', 'book cover', 'book synopsis', 'reading level',
    'book series', 'sequel', 'prequel', 'final chapter', 'author interview',
    'writing style', 'bestseller list', 'book award', 'pulitzer', 'man booker',
    'new release', 'classic literature', 'famous author', 'book quotes', 'literary critic',
    'book summary', 'reading recommendations', 'literature review', 'book club picks',
    'book quotes', 'literary awards', 'publish date', 'print run', 'limited edition',
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
        const gemmaAnswer = await fetchGemmaAnswer(userInput);
        setMessages(prev => [...prev, { id: prev.length + 1, text: gemmaAnswer, sender: 'bot' }]);
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
