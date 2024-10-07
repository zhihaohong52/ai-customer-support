// frontend/src/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';  // Import chat-ui styles
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator
} from '@chatscope/chat-ui-kit-react';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef(null);

  // Scroll to the bottom when new messages arrive
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user', timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();
      const aiMessage = { text: data.message, sender: 'ai', timestamp: new Date().toLocaleTimeString() };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { text: 'Error connecting to the AI service.', sender: 'error', timestamp: new Date().toLocaleTimeString() };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <MainContainer responsive style={{ height: '100%' }}>
        <ChatContainer>
          <MessageList typingIndicator={loading ? <TypingIndicator content="AI is typing..." /> : null}>
            {messages.map((msg, index) => (
              <Message
                key={index}
                model={{
                  message: msg.text,
                  sentTime: msg.timestamp,
                  sender: msg.sender === 'user' ? 'You' : 'AI',
                  direction: msg.sender === 'user' ? 'outgoing' : 'incoming',
                  position: 'normal'
                }}
              />
            ))}
            <div ref={messageEndRef} />
          </MessageList>
          <MessageInput
            placeholder="Type your message here..."
            value={input}
            onChange={(value) => setInput(value)}
            onSend={sendMessage}
            attachButton={false}
            sendButton={!loading}  // Disable send button when loading
            disabled={loading}     // Disable input when loading
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

export default Chatbot;
