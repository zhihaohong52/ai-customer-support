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
import './Chatbot.css';

const Chatbot = ({ user }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]); // Chat history
  const [selectedChatId, setSelectedChatId] = useState(null); // Currently selected chat
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768); // Sidebar visibility
  const messageEndRef = useRef(null);

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
      setChats(chatList);
      // Load the first chat by default if chats exist
      if (chatList.length > 0) {
        setSelectedChatId(chatList[0].id);
        setMessages(chatList[0].messages || []);
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
        profilePicture: 'https://via.placeholder.com/40?text=AI'
      };
      setMessages([initialBotMessage]);
    }
  }, [messages]);

  // Start a new chat and update the chat history
const startNewChat = async () => {
  try {
    const newChatRef = await addDoc(chatCollectionRef, {
      createdAt: new Date(),
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(), // Make sure it's saved as ISO string
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
        timestamp: new Date().toISOString(), // Make sure it's saved as ISO string
        profilePicture: 'https://via.placeholder.com/40?text=AI', // Placeholder for AI profile picture
      };

      // Update Firestore with the new messages
      const chatDocRef = doc(firestore, `users/${user.uid}/chats/${selectedChatId}`);
      await updateDoc(chatDocRef, {
        messages: [...messages, userMessage, aiMessage],
      });

    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        text: 'Error connecting to the AI service. Please try again later.',
        sender: 'error',
        timestamp: new Date().toISOString(), // Make sure it's saved as ISO string
        profilePicture: 'https://via.placeholder.com/40?text=Err',
      };
    } finally {
      setLoading(false);
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Date formatting options
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return (
    <div className="chat-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar rendered conditionally */}
      <MainContainer responsive style={{ height: '100%', flex: 1 }}>
        {showSidebar && (
          <Sidebar className="sidebar" position="left" scrollable style={{ width: '250px' }}>
            <ConversationList>
              <button onClick={startNewChat} className="App-link">New Chat</button>
              {chats.map(chat => (
                <div key={chat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Conversation
                    name={new Date(chat.createdAt.seconds * 1000).toLocaleDateString()}
                    onClick={() => setSelectedChatId(chat.id)}
                  />
                  <button onClick={() => deleteChat(chat.id)} className="App-link delete-btn">Delete</button>
                </div>
              ))}
            </ConversationList>
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
      {/* Toggle Sidebar Button */}
      <button
        onClick={toggleSidebar}
        className='App-link'
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 999,
        }}
      >
        {showSidebar ? 'Hide' : 'Show'} Chat History
      </button>
    </div>
  );
};

export default Chatbot;
