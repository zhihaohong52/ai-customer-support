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
  Avatar,
  Sidebar,
  ConversationList,
  Conversation,
} from '@chatscope/chat-ui-kit-react';
import { firestore } from './firebase'; // Firestore integration
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

/* Import Material UI Icons */
import MenuIcon from '@mui/icons-material/Menu';  // For toggle button
import DeleteIcon from '@mui/icons-material/Delete';  // For delete button
import IconButton from '@mui/material/IconButton'; // For clickable icons
import Drawer from '@mui/material/Drawer';

import { format, isToday, isYesterday } from 'date-fns'; // Import date formatting functions
import './Chatbot.css';

const Chatbot = ({ user }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]); // Chat history
  const [selectedChatId, setSelectedChatId] = useState(null); // Currently selected chat
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768); // Sidebar visibility
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messageEndRef = useRef(null);

  // Handle screen resizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setDrawerOpen(false);
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firestore collection reference for the user
  const chatCollectionRef = collection(firestore, `users/${user.uid}/chats`);

  // Scroll to the bottom when new messages arrive
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts
  useEffect(() => {
    const fetchChats = async () => {
      const chatSnapshot = await getDocs(chatCollectionRef);
      const chatList = chatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by updatedAt in descending order (most recent first)
      const sortedChats = chatList.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt.seconds * 1000);
        const dateB = new Date(b.updatedAt || b.createdAt.seconds * 1000);
        return dateB - dateA;
      });

      setChats(sortedChats);

      // Load the first chat by default if chats exist
      if (chatList.length > 0) {
        setSelectedChatId(chatList[0].id);
        setMessages(chatList[0].messages || []);
      } else {
        // Start a new chat if no chats exist
        await startNewChat();
      }
    };
    fetchChats();
  }, [user]);

  // Watch for changes in the selected chat
  useEffect(() => {
    if (selectedChatId) {
      const chatDocRef = doc(firestore, `users/${user.uid}/chats/${selectedChatId}`);
      const unsubscribe = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
          setMessages(doc.data().messages || []);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedChatId, user]);

  // Add initial bot message when a new chat starts
  useEffect(() => {
    if (messages.length === 0) {
      const initialBotMessage = {
        text: "Hi, my name is AI Customer Support. How can I help you today?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        profilePicture: 'pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png'
      };
      setMessages([initialBotMessage]);
    }
  }, [messages]);

  // Start a new chat and update the chat history
const startNewChat = async () => {
  try {
    const newChatRef = await addDoc(chatCollectionRef, {
      createdAt: new Date(),
      title: 'New Chat', // Initial placeholder title
      messages: [],
    });

    // Fetch the updated chat list after creating the new chat
    const chatSnapshot = await getDocs(chatCollectionRef);
    const chatList = chatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setChats(chatList); // Update the chat history
    setSelectedChatId(newChatRef.id); // Set the new chat as the selected chat
    setMessages([]); // Clear messages for the new chat
  } catch (error) {
    console.error('Error creating a new chat:', error);
  }
};

  // Delete a chat
  const deleteChat = async (chatId) => {
    try {
      // Delete the chat from Firestore
      await deleteDoc(doc(firestore, `users/${user.uid}/chats/${chatId}`));

      // Update the chat list by removing the deleted chat
      setChats((prevChats) => prevChats.filter(chat => chat.id !== chatId));

      // If the deleted chat is the currently selected chat, start a new chat
      if (chatId === selectedChatId) {
        setMessages([]); // Clear messages since the active chat was deleted
        setSelectedChatId(null); // Clear selected chat

        // Start a new chat automatically after deleting the current active chat
        await startNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Send a message and get AI response + possibly generate title
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(), // Make sure it's saved as ISO string
      profilePicture: user.photoURL || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png', // Use user profile picture or a placeholder
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

      // Create the conversation context by combining all previous messages
      const conversationContext = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n');

      // Determine if the title should be generated (only for the first message)
      const shouldGenerateTitle = messages.length === 1;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          context: conversationContext,
          generateTitle: shouldGenerateTitle, // Tell the backend if title generation is needed
        }),
      });

      const { message, title } = await response.json();
      const aiMessage = {
        text: message,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        profilePicture: 'pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png'
      };

      // Update Firestore with the new messages
      const chatDocRef = doc(firestore, `users/${user.uid}/chats/${selectedChatId}`);
      await updateDoc(chatDocRef, {
        messages: [...messages, userMessage, aiMessage],
        updatedAt: new Date().toISOString(), // Update the conversation's last updated time
      });

      if (shouldGenerateTitle && title) {
        const cleanTitle = title.replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
        await updateDoc(chatDocRef, { title: cleanTitle });

        // Refresh chat history to reflect the updated title
        const chatSnapshot = await getDocs(chatCollectionRef);
        const chatList = chatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChats(chatList);
        renderSidebarContent();
      }

    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        text: 'Error connecting to the AI service. Please try again later.',
        sender: 'error',
        timestamp: new Date().toISOString(),
        profilePicture: 'pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png',
      };

      setMessages((prev) => [...prev, errorMessage]);
      setLoading(false); // Ensure loading is set to false even on error
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      setShowSidebar(!showSidebar);
    }
  };

  const renderSidebarContent = () => (
    <ConversationList>
      <button onClick={startNewChat} className="new-chat-button">New Chat</button>
      <h2 style={{ fontSize: '1.2rem', margin: '10px 0', textAlign: 'center' }}>Chat History</h2>
      {/* Group chats by date */}
      {Object.entries(
        chats.reduce((acc, chat) => {
          const date = formatDate(chat.updatedAt || chat.createdAt.seconds * 1000);
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(chat);
          return acc;
        }, {})
      ).map(([date, chatGroup]) => (
        <React.Fragment key={date}>
          <div className="date-header">{date}</div>
          {chatGroup.map((chat) => (
            <div key={chat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Conversation
                className={`conversation-title ${
                  selectedChatId === chat.id ? 'selected-chat' : ''
                }`}
                name={chat.title || 'New Chat'}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  if (isMobile) {
                    setDrawerOpen(false); // Close drawer on mobile
                  }
                }}
              />
              <IconButton onClick={() => deleteChat(chat.id)} aria-label="delete chat" color="grey">
                <DeleteIcon />
              </IconButton>
            </div>
          ))}
        </React.Fragment>
      ))}
    </ConversationList>
  );

  // Date formatting options
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const formatDate = (date) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) {
      return 'Today';
    } else if (isYesterday(dateObj)) {
      return 'Yesterday';
    } else {
      return format(dateObj, 'MMMM d, yyyy'); // e.g., "October 8, 2024"
    }
  };

  return (
    <div className="chat-container" style={{ display: 'flex', height: '100vh' }}>
      <MainContainer responsive style={{ height: '100%', flex: 1 }}>
        {!isMobile && showSidebar && (
          <Sidebar className="sidebar" position="left" scrollable style={{ width: '250px' }}>
            {renderSidebarContent()}
          </Sidebar>
        )}
        <ChatContainer>
          <MessageList typingIndicator={loading ? <TypingIndicator content="AI is typing..." /> : null}>
            {messages.map((msg, index) => (
              <>
                {index === 0 || new Date(messages[index].timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString() ? (
                  <MessageSeparator content={new Date(msg.timestamp).toLocaleDateString(undefined, options)} />
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
                    size="md"
                  />
                  <Message.TextContent text={msg.text} />
                  <Message.Footer className="message-footer">
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

      {/* Drawer for mobile */}
      {isMobile && (
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div style={{ width: '250px' }}>
            {renderSidebarContent()}
          </div>
        </Drawer>
      )}

      {/* Toggle Sidebar Button */}
      <IconButton
        onClick={toggleSidebar}
        aria-label="toggle sidebar"
        style={{
          position: 'absolute',
          color: 'white',
          top: '30px',
          left: '15px',
          transform: 'translateY(-50%)',  // Adjust to vertically center it
          zIndex: 10000,
        }}
      >
        <MenuIcon />
      </IconButton>
    </div>
  );
};

export default Chatbot;
