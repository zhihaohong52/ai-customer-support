// frontend/src/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';  // Import chat-ui styles
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageSeparator,
  MessageInput,
  TypingIndicator,
  Avatar
} from '@chatscope/chat-ui-kit-react';

const Chatbot = ({ user }) => {
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

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date(),
      profilePicture: user.photoURL || 'https://via.placeholder.com/40', // Use user profile picture or a placeholder
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

      // Create the conversation context by combining all previous messages
      const conversationContext = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n');

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          context: conversationContext
        }),
      });

      const data = await response.json();
      const aiMessage = {
        text: data.message,
        sender: 'ai',
        timestamp: new Date(),
        profilePicture: 'https://via.placeholder.com/40?text=AI', // Placeholder for AI profile picture
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        text: 'Error connecting to the AI service. Please try again later.',
        sender: 'error',
        timestamp: new Date(),
        profilePicture: 'https://via.placeholder.com/40?text=Err',
      };

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
              <>
                {index === 0 || new Date(messages[index].timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString() ? (
                  <MessageSeparator content={new Date(msg.timestamp).toLocaleDateString()} />
                ) : null}

                <Message
                  key={index}
                  model={{
                    direction: msg.sender === 'user' ? 'outgoing' : 'incoming',
                    position: 'normal',
                    sender: msg.sender,
                  }}
                  avatarPosition={msg.sender === 'user' ? 'trailing' : 'leading'}
                >
                  <Avatar
                    src={msg.profilePicture}
                    name={msg.sender === 'user' ? 'You' : 'AI'}
                    size="40"
                  />
                  <Message.TextContent text={msg.text} />
                  <Message.Footer className="message-footer"> {/* Add the class here */}
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </Message.Footer>
                </Message>
              </>
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
