// frontend/src/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
  TextField,
  Grid,
  Divider,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Menu as MenuIcon, Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';
import { firestore } from './firebase'; // Firestore integration
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { format, isToday, isYesterday } from 'date-fns';
import './Chatbot.css';

const Chatbot = ({ user }) => {
  // State variables
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]); // Chat history
  const [selectedChatId, setSelectedChatId] = useState(null); // Currently selected chat
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768); // Sidebar visibility
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    'How can I open a new account?',
    'Tell me about your loan options.',
    'How do I report a lost card?',
    'What are your hours of operation?',
    'How can I contact customer support?',
  ]);
  const [isFetchingPrompts, setIsFetchingPrompts] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // State for typing indicator
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

  // Scroll to the bottom when new messages arrive or typing indicator changes
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, suggestedPrompts]);

  // Load chat history when component mounts
  useEffect(() => {
    const fetchChats = async () => {
      const chatSnapshot = await getDocs(chatCollectionRef);
      const chatList = chatSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
        text: 'Hi, my name is AI Customer Support. How can I help you today?',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        profilePicture: 'pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png',
      };
      setMessages([initialBotMessage]);
    }
  }, [messages]);

  // Watch for changes and fetch suggested prompts when messages change
  useEffect(() => {
    if (!isTyping) {
      fetchSuggestedPrompts();
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
      const chatList = chatSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

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

  // Send a message and get AI response
  const sendMessage = async (messageText) => {
    const message = messageText || input;
    if (!message.trim()) return;

    const userMessage = {
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      profilePicture:
        user.photoURL ||
        'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setIsTyping(true); // Start typing indicator
    setSuggestedPrompts([]); // Hide suggested prompts
    setInput('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

      // Create the conversation context
      const conversationContext = messages
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join('\n');

      // Determine if the title should be generated
      const shouldGenerateTitle = messages.length === 1;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          context: conversationContext,
          generateTitle: shouldGenerateTitle,
        }),
      });

      const { message: aiResponse, title } = await response.json();
      const aiMessage = {
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        profilePicture: 'pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png',
      };

      // Update Firestore with the new messages
      const chatDocRef = doc(firestore, `users/${user.uid}/chats/${selectedChatId}`);
      await updateDoc(chatDocRef, {
        messages: [...messages, userMessage, aiMessage],
        updatedAt: new Date().toISOString(),
      });

      if (shouldGenerateTitle && title) {
        const cleanTitle = title.replace(/^"(.*)"$/, '$1');
        await updateDoc(chatDocRef, { title: cleanTitle });

        // Refresh chat history to reflect the updated title
        const chatSnapshot = await getDocs(chatCollectionRef);
        const chatList = chatSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatList);
        // No need to call renderSidebarContent here as the sidebar updates automatically
      }

      setIsTyping(false); // Stop typing indicator
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        text: 'Error connecting to the AI service. Please try again later.',
        sender: 'error',
        timestamp: new Date().toISOString(),
        profilePicture: 'pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png',
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false); // Ensure typing indicator stops on error
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch suggested prompts
  const fetchSuggestedPrompts = async () => {
    console.log('Fetching suggested prompts...');
    setIsFetchingPrompts(true); // Start loading
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

      // Create the conversation context
      const conversationContext = messages
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join('\n');

      const response = await fetch(`${API_URL}/api/suggested-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: conversationContext,
        }),
      });

      const data = await response.json();

      // Process the prompts
      const processedPrompts = data.prompts.map((prompt) => {
        prompt = prompt.replace(/^\d+\.\s*/, '');
        prompt = prompt.replace(/^"(.*)"$/, '$1');
        return prompt;
      });

      console.log('Suggested Prompts:', processedPrompts);
      setSuggestedPrompts(processedPrompts);
    } catch (error) {
      console.error('Error fetching suggested prompts:', error);
      setSuggestedPrompts([]); // Clear prompts on error
    } finally {
      setIsFetchingPrompts(false); // End loading
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
    <Box>
      <Button
        onClick={startNewChat}
        variant="contained"
        color="primary"
        sx={{ margin: 1, width: 'calc(100% - 16px)', textTransform: 'none', fontSize: '1.2rem' }}
      >
        New Chat
      </Button>
      <Typography variant="h6" align="center" sx={{ marginY: 2, fontSize: '1rem' }}>
        Chat History
      </Typography>
      <Divider />

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
          <Typography variant="subtitle2" align="center" sx={{ marginY: 1 }}>
            {date}
          </Typography>
          <List>
            {chatGroup.map((chat) => (
              <ListItem
                key={chat.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the ListItemButton click
                      deleteChat(chat.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                disablePadding
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(63, 81, 181, 0.05)', // Light hover effect
                  },
                }}
              >
                <ListItemButton
                  selected={selectedChatId === chat.id}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    if (isMobile) {
                      setDrawerOpen(false);
                    }
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(63, 81, 181, 0.1)', // Light blue background for selected
                      '&:hover': {
                        backgroundColor: 'rgba(63, 81, 181, 0.15)', // Darker on hover
                      },
                    },
                  }}
                >
                  <ListItemText primary={chat.title || 'New Chat'} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </React.Fragment>
      ))}
    </Box>
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
      return format(dateObj, 'MMMM d, yyyy');
    }
  };

  return (
    <Box className="chat-container" sx={{ display: 'flex', flex: 1, position: 'relative' }}>
      {/* Sidebar */}
      {!isMobile && showSidebar && (
        <Box className="sidebar" sx={{ width: 250, borderRight: '1px solid #e0e0e0' }}>
          {renderSidebarContent()}
        </Box>
      )}

      {/* Chat Content */}
      <Box className="chat-content" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <Box className="message-list" sx={{ flex: 1, overflowY: 'auto', padding: 2, backgroundColor: '#f0f0f0' }}>
          {messages.map((msg, index) => (
            <Box key={index} sx={{ marginBottom: 3 }}> {/* Increased margin */}
              {/* Date Separator */}
              {(index === 0 ||
                new Date(messages[index].timestamp).toDateString() !==
                  new Date(messages[index - 1].timestamp).toDateString()) && (
                <Typography variant="caption" align="center" sx={{ display: 'block', margin: 1 }}>
                  {new Date(msg.timestamp).toLocaleDateString(undefined, options)}
                </Typography>
              )}

              {/* Message */}
              <Stack
                direction="row"
                spacing={1}
                justifyContent={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                alignItems="flex-start"
                sx={{ marginBottom: 2 }}
              >
                {msg.sender !== 'user' && (
                  <Avatar src={msg.profilePicture} alt={msg.sender} className="message-avatar" />
                )}
                <Box
                  className="message-paper"
                  sx={{
                    backgroundColor: msg.sender === 'user' ? '#DCF8C6' : '#FFFFFF', // User: Light Green, AI: White
                    borderRadius: 2,
                    padding: 1,
                    maxWidth: '60%',
                    boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                    borderTopLeftRadius: msg.sender === 'user' ? '16px' : '0px',
                    borderTopRightRadius: msg.sender === 'user' ? '0px' : '16px',
                  }}
                >
                  <Typography variant="body1">{msg.text}</Typography>
                  {/* Timestamp */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>
                {msg.sender === 'user' && (
                  <Avatar src={msg.profilePicture} alt="You" className="message-avatar" />
                )}
              </Stack>
            </Box>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <Box
              className="typing-indicator"
              aria-live="polite" // Announces dynamic content changes
              aria-atomic="true"
              sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}
            >
              <Avatar src="pictures/he_caf28749-8dd9-4704-ab42-e076ff1d8f90.png" alt="AI" />
              <Typography variant="body2" color="textSecondary" sx={{ marginLeft: 1 }}>
                AI is typing...
              </Typography>
              <Box className="typing-dots" sx={{ marginLeft: 1 }}>
                <span></span>
                <span></span>
                <span></span>
              </Box>
            </Box>
          )}

          {/* Suggested Prompts */}
          {isFetchingPrompts ? (
            <Box sx={{ padding: 2, backgroundColor: '#e0e0e0', borderRadius: 2, marginTop: 2 }}>
              <Typography variant="subtitle1">Attempting to fetch suggested prompts...</Typography>
            </Box>
          ) : (
            !isTyping && suggestedPrompts.length > 0 && (
              <Box sx={{ padding: 2, backgroundColor: '#e0e0e0', borderRadius: 2, marginTop: 2 }}>
                <Typography variant="subtitle1">Suggested Prompts:</Typography>
                <Grid container spacing={1}>
                  {suggestedPrompts.map((prompt, index) => (
                    <Grid item key={index}>
                      <Button
                        variant="outlined"
                        onClick={() => sendMessage(prompt)}
                        sx={{ textTransform: 'none' }} // Ensures normal sentence case
                      >
                        {prompt}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )
          )}

          {/* Reference for scrolling */}
          <div ref={messageEndRef} />
        </Box>

        {/* Message Input */}
        <Box className="message-input" sx={{ padding: 0.5, borderTop: '1px solid #ddd', backgroundColor: '#fff', flexShrink: 0 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs>
              <TextField
                fullWidth
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item>
              <IconButton color="primary" onClick={() => sendMessage()} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Drawer for Mobile */}
      {isMobile && (
        <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            top: '60px', // Header height
            height: 'calc(100% - 60px)', // Adjusted height
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ width: 250 }}>
          {renderSidebarContent()}
        </Box>
      </Drawer>
      )}

      {/* Toggle Sidebar Button */}
      <IconButton
        onClick={toggleSidebar}
        aria-label="toggle sidebar"
        sx={{
          position: 'fixed', // Ensures it's always visible
          color: 'white', // Adjust based on your design
          top: 10,
          left: 10,
          zIndex: 10000,
        }}
      >
        <MenuIcon />
      </IconButton>
    </Box>
  );
};

export default Chatbot;
