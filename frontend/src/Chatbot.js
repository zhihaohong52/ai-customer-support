// frontend/src/Chatbot.js
import React, { useState } from 'react';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to handle sending the user message to the backend
  const sendMessage = async () => {
    if (!input.trim()) return; // Prevent sending empty messages

    setLoading(true); // Set loading to true during API call
    try {
      const result = await fetch('http://localhost:8080/api/chat', {  // Ensure the correct URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await result.json();
      setResponse(data.message);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setResponse('There was an error connecting to the AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask the chatbot..."
        className="input-box" /* Apply the input-box class here */
        rows="3"
      />
      <button onClick={sendMessage} disabled={loading} className="send-button">
        {loading ? 'Sending...' : 'Send'}
      </button>
      {response && (
        <div className="chatbot-response">
          <strong>AI Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
