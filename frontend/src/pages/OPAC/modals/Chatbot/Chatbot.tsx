import React, { useState, useEffect, useRef } from "react";
import styles from "./Chatbot.module.css";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const initialMessages: Message[] = [
  { id: "welcome", text: "Welcome to LibraX Chatbot!", sender: "bot" },
  { id: "help", text: "Ask about book titles, authors, or release dates.", sender: "bot" }
];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [open, setOpen] = useState(true); // To control minimize/maximize
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now() + "user", text: input.trim(), sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const formattedMessages = [...messages, userMsg].map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      const response = await fetch("https://librax-chatbot.puter.work/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedMessages }),
      });

      const data = await response.json();
      const botReply = data.reply || "No response from AI.";
      setMessages(prev => [...prev, { id: Date.now() + "bot", text: botReply, sender: "bot" }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + "err", text: "Error: " + (err.message || "Failed to get AI response"), sender: "bot" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Header clickable to toggle open state */}
      <div
        className={styles.header}
        onClick={() => setOpen(o => !o)}
        style={{ cursor: "pointer" }}
      >
        <b>LibraX Chatbot</b>
        <span style={{ float: "right" }}>{open ? "▼" : "▲"}</span>
      </div>

      {/* Render chat body only if open */}
      {open && (
        <div className={styles.chatBody}>
          <div className={styles.messagesArea}>
            {messages.map(msg => (
              <div key={msg.id} className={msg.sender === "user" ? styles.userBubble : styles.botBubble}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className={styles.botBubble}>
                <span className={styles.typing}><span>.</span><span>.</span><span>.</span></span>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Ask about book titles, authors, or release dates..."
              value={input}
              className={styles.inputBox}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
            />
            <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim()}>
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
